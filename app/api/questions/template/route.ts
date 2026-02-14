import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ─── GET /api/questions/template ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") || "BSABEN";

    if (course !== "BSABEN" && course !== "BSGE") {
      return NextResponse.json({ error: "Invalid course. Must be BSABEN or BSGE." }, { status: 400 });
    }

    const wb = XLSX.utils.book_new();

    // ── Questions sheet ────────────────────────────────────────────────────────
    let headers: string[];
    let exampleRows: string[][];
    let colWidths: Array<{ wch: number }>;

    if (course === "BSABEN") {
      // BSABEN template with area column
      headers = [
        "question_text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_answer",
        "difficulty",
        "category",
        "area",
        "subject",
        "explanation",
      ];

      exampleRows = [
        [
          "Calculate the total hydrostatic force on a submerged vertical rectangular gate (2m × 3m) with its top edge 1.5m below the water surface.",
          "85.3 kN",
          "96.2 kN",
          "72.5 kN",
          "108.4 kN",
          "B",
          "Hard",
          "Engineering Science",
          "Hydraulics",
          "Fluid Flow",
          "Use F = ρg·ȳ·A where ȳ is depth to centroid.",
        ],
        [
          "What is the continuity equation in fluid mechanics?",
          "F = ma",
          "A₁V₁ = A₂V₂",
          "P₁ + ρgh₁ = P₂ + ρgh₂",
          "Q = VA",
          "B",
          "Medium",
          "Engineering Science",
          "Hydraulics",
          "Fluid Mechanics",
          "The continuity equation states that mass flow rate is constant in a steady flow system.",
        ],
      ];

      colWidths = [
        { wch: 70 }, // question_text
        { wch: 30 }, // option_a
        { wch: 30 }, // option_b
        { wch: 30 }, // option_c
        { wch: 30 }, // option_d
        { wch: 16 }, // correct_answer
        { wch: 14 }, // difficulty
        { wch: 26 }, // category
        { wch: 24 }, // area
        { wch: 30 }, // subject
        { wch: 45 }, // explanation
      ];
    } else {
      // BSGE template without area column
      headers = [
        "question_text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_answer",
        "difficulty",
        "category",
        "subject",
        "explanation",
      ];

      exampleRows = [
        [
          "Under RA 8560, define the scope of Geodetic Engineering practice.",
          "Land surveying only",
          "Hydrographic surveys only",
          "All surveying activities including land, geodetic, and cadastral",
          "Environmental impact assessment",
          "C",
          "Medium",
          "Laws & Ethics",
          "Professional Practice",
          "RA 8560 covers the full scope of Geodetic Engineering in the Philippines.",
        ],
        [
          "What is the primary purpose of a cadastral survey?",
          "Topographic mapping",
          "Property boundary establishment",
          "Route alignment",
          "Geological exploration",
          "B",
          "Easy",
          "Surveying",
          "Land Surveying",
          "Cadastral surveys establish and document property boundaries for legal purposes.",
        ],
      ];

      colWidths = [
        { wch: 70 }, // question_text
        { wch: 30 }, // option_a
        { wch: 30 }, // option_b
        { wch: 30 }, // option_c
        { wch: 30 }, // option_d
        { wch: 16 }, // correct_answer
        { wch: 14 }, // difficulty
        { wch: 26 }, // category
        { wch: 30 }, // subject
        { wch: 45 }, // explanation
      ];
    }

    const wsData = [headers, ...exampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    // ── Instructions sheet ─────────────────────────────────────────────────────
    const instructionRows = [
      [`${course} QUESTION BANK IMPORT TEMPLATE`],
      [""],
      ["REQUIRED COLUMNS (marked with *)"],
      ["question_text    – Full question text (must be unique within this course)"],
      ["option_a         – Choice A (required)"],
      ["option_b         – Choice B (required)"],
      ["option_c         – Choice C (optional, required if correct_answer = C)"],
      ["option_d         – Choice D (optional, required if correct_answer = D)"],
      ["correct_answer   – One of: A, B, C, D"],
      ["difficulty       – One of: Easy, Medium, Hard"],
      ["category         – e.g. Engineering Science, Laws & Ethics, Mathematics, Surveying"],
    ];

    if (course === "BSABEN") {
      instructionRows.push(
        ["area             – e.g. Hydraulics, Soil Mechanics, Structural Analysis (REQUIRED for BSABEN)"],
        ["subject          – e.g. Fluid Flow, Fluid Mechanics, Open Channel Flow"]
      );
    } else {
      instructionRows.push(
        ["subject          – e.g. Surveying, Geodesy, Professional Practice, Remote Sensing"]
      );
    }

    instructionRows.push(
      ["explanation      – Optional explanation for the correct answer"],
      [""],
      ["DUPLICATE DETECTION"],
      ["The system performs two duplicate checks before importing each row:"],
      ["  1. Within the uploaded file itself — identical question texts in the same file are skipped."],
      ["  2. Against the existing database — questions already stored are skipped."],
      course === "BSABEN" 
        ? ["For BSABEN: Duplicates are detected based on area + subject + question text combination."]
        : ["For BSGE: Duplicates are detected based on subject + question text combination."],
      ["Skipped rows are reported in the import summary. Valid rows are imported automatically."],
      [""],
      ["TIPS"],
      ["• Do NOT modify the column headers in row 1 of the Questions sheet."],
      ["• Delete the example rows (rows 2 and 3) before uploading your data."],
      ["• Correct answer must exactly match A, B, C, or D (case-insensitive)."],
      ["• Maximum 500 questions per upload."],
      ["• Supported file formats: .xlsx, .xls"],
      [""],
      ["AVAILABLE SUBJECTS (examples)"]
    );

    if (course === "BSABEN") {
      instructionRows.push(
        ["AREAS & SUBJECTS:"],
        ["Hydraulics: Fluid Flow, Fluid Mechanics, Open Channel Flow, Pipe Flow, Hydraulic Machinery"],
        ["Soil Mechanics: Soil Properties, Soil Classification, Bearing Capacity, Foundation Design"],
        ["Structural Analysis: Statics, Strength of Materials, Steel Design, Concrete Design"],
        ["Surveying: Land Surveying, Route Surveying, Construction Surveying"],
        ["Mathematics: Algebra, Calculus, Differential Equations, Engineering Mathematics"],
        ["Laws & Ethics: Professional Practice, Philippine Laws, Engineering Ethics"]
      );
    } else {
      instructionRows.push(
        ["BSGE SUBJECTS:"],
        ["Surveying, Geodesy, Professional Practice, Laws & Ethics, Remote Sensing,"],
        ["Cartography, Land Surveying, Hydrographic Surveying, GIS, Photogrammetry,"],
        ["Cadastral Surveying, Engineering Mathematics"]
      );
    }

    const wsInfo = XLSX.utils.aoa_to_sheet(instructionRows);
    wsInfo["!cols"] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

    // ── Serialize to buffer ────────────────────────────────────────────────────
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${course.toLowerCase()}_questions_template.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/questions/template error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}