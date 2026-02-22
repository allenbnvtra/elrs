import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, CourseType, DifficultyType, CorrectAnswer } from "@/models/Questions";
import { User } from "@/models/User";

const VALID_COURSES: CourseType[] = ["BSABEN", "BSGE"];
const VALID_DIFFICULTIES: DifficultyType[] = ["Easy", "Medium", "Hard"];
const VALID_ANSWERS: CorrectAnswer[] = ["A", "B", "C", "D"];

interface ParsedQuestion {
  questionNumber: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  correctAnswer?: CorrectAnswer;
  category?: string;
  rawText: string;
}

function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const PDFParser = require('pdf2json');
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('❌ PDF parse error:', errData);
        reject(new Error(errData.parserError || 'Failed to parse PDF'));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract text from all pages
          let fullText = '';
          
          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                let currentLine = '';
                let lastY = -1;
                
                for (const text of page.Texts) {
                  const y = text.y || 0;
                  
                  // New line if Y position changed significantly
                  if (lastY !== -1 && Math.abs(y - lastY) > 0.1) {
                    if (currentLine.trim()) {
                      fullText += currentLine.trim() + '\n';
                    }
                    currentLine = '';
                  }
                  
                  if (text.R) {
                    for (const r of text.R) {
                      if (r.T) {
                        // Decode URI-encoded text and add space between words
                        currentLine += decodeURIComponent(r.T) + ' ';
                      }
                    }
                  }
                  
                  lastY = y;
                }
                
                // Add remaining line
                if (currentLine.trim()) {
                  fullText += currentLine.trim() + '\n';
                }
              }
            }
          }
          
          console.log('📝 Extracted text length:', fullText.length);
          
          if (!fullText || fullText.length === 0) {
            reject(new Error('No text could be extracted from the PDF. The PDF might be image-based or scanned.'));
            return;
          }
          
          resolve(fullText);
        } catch (error: any) {
          reject(error);
        }
      });
      
      // Parse buffer
      pdfParser.parseBuffer(buffer);
    });
  } catch (error: any) {
    console.error('❌ PDF extraction error:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF.');
    }
    if (error.message?.includes('encrypted')) {
      throw new Error('The PDF is password-protected. Please remove encryption and try again.');
    }
    if (error.message?.includes('No text could be extracted')) {
      throw error;
    }
    
    throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
  }
}

function parseQuestions(pdfText: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let currentCategory = "";
  
  console.log('📝 Starting to parse questions from text...');
  
  const lines = pdfText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log('📋 Total lines to process:', lines.length);
  
  let i = 0;
  let questionCount = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // ===== DETECT CATEGORY HEADERS =====
    const categoryPatterns = [
      /^(.+?)\s*\((\d+)\s*items?\):?$/i,          // "Category (14 items):"
      /^CATEGORY:\s*(.+)$/i,                       // "CATEGORY: Name"
      /^(.+?)\s*-\s*(\d+)\s*questions?$/i,        // "Category - 14 questions"
      /^(.+?)\s*\((\d+)\):?$/i                    // "Category (14):"
    ];
    
    for (const pattern of categoryPatterns) {
      const match = line.match(pattern);
      if (match) {
        currentCategory = match[1].trim();
        console.log('📂 Found category:', currentCategory);
        i++;
        continue;
      }
    }
    
    // ===== DETECT QUESTION NUMBER =====
    const questionPatterns = [
      /^(\d+(?:\s*[–—-]\s*\d+)?)[.)]\s*(.+)/,                    // "1." or "1)" or "1-2." or "1 – 2."
      /^Question\s+(\d+(?:\s*[–—-]\s*\d+)?)[:.]\s*(.+)/i,       // "Question 1:" or "Question 1-2:"
      /^Q\.?\s*(\d+(?:\s*[–—-]\s*\d+)?)[:.]\s*(.+)/i            // "Q.1:" or "Q 1-2:"
    ];
    
    let questionMatch = null;
    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) break;
    }
    
    if (questionMatch) {
      const questionNumber = questionMatch[1]
        .replace(/\s+/g, '')
        .replace(/[–—]/g, '-');
      let questionText = questionMatch[2];
      
      console.log(`❓ Found question ${questionNumber}`);
      
      // ===== COLLECT MULTI-LINE QUESTION TEXT =====
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        
        if (/^[a-e][.)]\s+/i.test(nextLine) || 
            /^(\d+[.)]|Question\s+\d+|Q\.?\s*\d+)/i.test(nextLine) ||
            /^(Refer to|Figure|Table|Image|Diagram)/i.test(nextLine)) {
          break;
        }
        
        questionText += ' ' + nextLine;
        i++;
      }
      
      // ===== PARSE OPTIONS =====
      const options: { [key: string]: string } = {};
      let correctAnswer: CorrectAnswer | undefined;
      
      while (i < lines.length) {
        const optionMatch = lines[i].match(/^([a-e])[.)]\s+(.+)/i);
        if (!optionMatch) break;
        
        const optionLetter = optionMatch[1].toUpperCase();
        let optionText = optionMatch[2];
        
        // ===== CHECK FOR CORRECT ANSWER MARKERS =====
        const correctMarkers = [
          /\s*✓\s*/g,
          /\s*√\s*/g,
          /\s*✔\s*/g,
          /\s*\[X\]\s*/gi,
          /\s*\(X\)\s*/gi,
          /\s*\*\*?\s*/g,
          /\s*\(correct\)\s*/gi,
          /\s*\[correct\]\s*/gi,
          /\s*<--?\s*/g,
          /\s*--?>\s*/g,
          /\s*→\s*/g,
          /\s*←\s*/g,
          /\s*⟵\s*/g,
          /\s*⟶\s*/g
        ];
        
        for (const marker of correctMarkers) {
          if (marker.test(optionText)) {
            correctAnswer = optionLetter as CorrectAnswer;
            optionText = optionText.replace(marker, ' ').trim();
            console.log(`✅ Found correct answer marker: ${optionLetter}`);
          }
        }
        
        // Handle multi-line options
        let j = i + 1;
        while (j < lines.length) {
          const nextOptionLine = lines[j];
          
          if (/^[a-e][.)]\s+/i.test(nextOptionLine) || 
              /^(\d+[.)]|Question\s+\d+|Q\.?\s*\d+)/i.test(nextOptionLine) ||
              /^(Refer to|Figure|Table|Hydrometeorology|Agricultural)/i.test(nextOptionLine)) {
            break;
          }
          
          optionText += ' ' + nextOptionLine;
          j++;
        }
        
        options[optionLetter] = cleanText(optionText);
        i = j;
      }
      
      // ===== VALIDATION =====
      if (options['A'] && options['B']) {
        const question: ParsedQuestion = {
          questionNumber,
          questionText: cleanText(questionText),
          optionA: options['A'],
          optionB: options['B'],
          optionC: options['C'],
          optionD: options['D'],
          optionE: options['E'],
          correctAnswer,
          category: currentCategory || 'General',
          rawText: `Q${questionNumber}: ${cleanText(questionText).substring(0, 100)}...`
        };
        
        questions.push(question);
        questionCount++;
        
        const optionCount = Object.keys(options).length;
        const hasCorrect = correctAnswer ? '✓' : '✗';
        console.log(`${hasCorrect} Added Q${questionNumber} | ${optionCount} options | Cat: ${currentCategory || 'General'}${correctAnswer ? ` | Answer: ${correctAnswer}` : ''}`);
      } else {
        console.log(`⚠️ Skipped question ${questionNumber} - insufficient options`);
      }
      
      continue;
    }
    
    i++;
  }
  
  const withAnswers = questions.filter(q => q.correctAnswer).length;
  const withoutAnswers = questionCount - withAnswers;
  
  console.log(`\n✅ PARSING SUMMARY:`);
  console.log(`   Total questions parsed: ${questionCount}`);
  console.log(`   ✓ With correct answers: ${withAnswers}`);
  console.log(`   ✗ Missing answers: ${withoutAnswers}`);
  
  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string;
    const course = formData.get("course") as CourseType;
    const defaultSubject = formData.get("subject") as string;
    const defaultDifficulty = formData.get("difficulty") as DifficultyType;
    const defaultArea = formData.get("area") as string | null;

    console.log("📄 PDF Import request:", { 
      filename: file?.name, 
      size: file?.size,
      course, 
      subject: defaultSubject,
      difficulty: defaultDifficulty,
      area: defaultArea
    });

    // ===== VALIDATION =====
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!course) return NextResponse.json({ error: "course is required" }, { status: 400 });
    if (!defaultSubject) return NextResponse.json({ error: "subject is required" }, { status: 400 });
    if (!defaultDifficulty) return NextResponse.json({ error: "difficulty is required" }, { status: 400 });

    if (!VALID_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course. Must be BSABEN or BSGE." }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // ===== AUTH CHECK =====
    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ===== PARSE PDF =====
    console.log("📖 Starting PDF parsing...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfText = await extractTextFromPDF(buffer);
    
    console.log("📝 Extracted text length:", pdfText.length);
    console.log("📝 First 500 chars:", pdfText.substring(0, 500));
    
    if (!pdfText || pdfText.length < 50) {
      return NextResponse.json({ 
        error: "Could not extract meaningful text from PDF. The PDF may be image-based (scanned) or empty." 
      }, { status: 400 });
    }
    
    // ===== PARSE QUESTIONS =====
    const parsedQuestions = parseQuestions(pdfText);
    console.log("✅ Parsing complete. Found", parsedQuestions.length, "questions");

    if (parsedQuestions.length === 0) {
      return NextResponse.json({ 
        error: `No questions found in PDF. Please ensure:
• Questions are numbered (1., 2., etc. or 1-2. for ranges)
• Options are labeled (a., b., c., d.)
• The PDF contains actual text (not scanned images)

The parser detected ${pdfText.split('\n').length} lines but couldn't identify question patterns.`,
        hint: "Check the console logs for more details about what was found."
      }, { status: 400 });
    }

    // ===== COUNT STATISTICS =====
    const withAnswers = parsedQuestions.filter(q => q.correctAnswer).length;
    const withoutAnswers = parsedQuestions.length - withAnswers;
    const categories = [...new Set(parsedQuestions.map(q => q.category))];

    // ===== RETURN PREVIEW =====
    return NextResponse.json({
      message: `Found ${parsedQuestions.length} questions. ${withAnswers} have correct answers marked, ${withoutAnswers} need answers.`,
      questions: parsedQuestions,
      totalFound: parsedQuestions.length,
      withCorrectAnswers: withAnswers,
      needsAnswers: withoutAnswers,
      categories: categories,
      warning: withoutAnswers > 0 
        ? "⚠️ Some questions don't have correct answers marked. You'll need to set them manually before importing, or they will be skipped." 
        : null,
      tip: withoutAnswers > 0
        ? "Tip: If your PDF marks answers with colors (like red text), add text markers like '*' or '[X]' after correct answers before uploading."
        : null
    });

  } catch (error: any) {
    console.error("❌ PDF import error:", error);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json({ 
      error: "Failed to parse PDF", 
      details: error.message || "Unknown error occurred",
      suggestion: "Check the server console logs for detailed error information."
    }, { status: 500 });
  }
}

// ===== CONFIRM IMPORT ENDPOINT =====
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, userId, course, defaultSubject, defaultDifficulty, defaultArea } = body;

    console.log("💾 Confirming import:", {
      questionCount: questions?.length,
      course,
      subject: defaultSubject,
      area: defaultArea
    });

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid questions data" }, { status: 400 });
    }

    if (!userId || !course || !defaultSubject || !defaultDifficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const toInsert: Omit<Question, "_id">[] = [];
    const skipped: { reason: string; question: string }[] = [];

    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB) {
        skipped.push({
          reason: 'Missing required fields',
          question: q.questionText?.substring(0, 50) || 'Unknown'
        });
        continue;
      }

      if (!q.correctAnswer) {
        skipped.push({
          reason: 'No correct answer',
          question: q.questionText.substring(0, 50)
        });
        continue;
      }

      if (!VALID_ANSWERS.includes(q.correctAnswer)) {
        skipped.push({
          reason: `Invalid correct answer: ${q.correctAnswer}`,
          question: q.questionText.substring(0, 50)
        });
        continue;
      }

      toInsert.push({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC || undefined,
        optionD: q.optionD || undefined,
        correctAnswer: q.correctAnswer as CorrectAnswer,
        difficulty: q.difficulty || defaultDifficulty,
        category: q.category || 'General',
        course: course,
        area: course === "BSABEN" ? defaultArea : undefined,
        subject: q.subject || defaultSubject,
        explanation: undefined,
        isActive: true,
        createdBy: new ObjectId(userId),
        createdByName: user.name,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`✅ Validated: ${toInsert.length} to insert, ${skipped.length} skipped`);

    if (toInsert.length > 0) {
      await questionsCol.insertMany(toInsert as Question[]);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${toInsert.length} question${toInsert.length !== 1 ? 's' : ''}`,
      imported: toInsert.length,
      skipped: skipped.length,
      skippedDetails: skipped.length > 0 ? skipped : undefined,
      warning: skipped.length > 0 
        ? `${skipped.length} question${skipped.length !== 1 ? 's were' : ' was'} skipped due to missing data or validation errors.`
        : null
    });

  } catch (error: any) {
    console.error("❌ Confirm import error:", error);
    return NextResponse.json({ 
      error: "Failed to import questions",
      details: error.message 
    }, { status: 500 });
  }
}