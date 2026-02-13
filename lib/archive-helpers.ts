import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export interface ArchiveOptions {
  userId: string;
  userName: string;
  userRole: string;
  reason?: string;
  tags?: string[];
}

/**
 * Archive an exam
 */
export async function archiveExam(examId: string, options: ArchiveOptions) {
  const client = await clientPromise;
  const db = client.db();
  
  const exam = await db.collection("exams").findOne({ _id: new ObjectId(examId) });
  if (!exam) throw new Error("Exam not found");

  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "exam",
      title: exam.title || "Untitled Exam",
      description: exam.description,
      course: exam.course,
      originalId: examId,
      originalCollection: "exams",
      archivedBy: options.userId,
      archivedByName: options.userName,
      archivedByRole: options.userRole,
      reason: options.reason,
      originalData: exam,
      itemCount: exam.questions?.length || 0,
      tags: options.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive exam");
  }

  return response.json();
}

/**
 * Archive a review material
 */
export async function archiveMaterial(materialId: string, options: ArchiveOptions) {
  const client = await clientPromise;
  const db = client.db();
  
  const material = await db.collection("reviewMaterials").findOne({ _id: new ObjectId(materialId) });
  if (!material) throw new Error("Material not found");

  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "material",
      title: material.title,
      description: material.description,
      course: material.course,
      originalId: materialId,
      originalCollection: "reviewMaterials",
      archivedBy: options.userId,
      archivedByName: options.userName,
      archivedByRole: options.userRole,
      reason: options.reason,
      originalData: material,
      itemCount: 1,
      tags: options.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive material");
  }

  return response.json();
}

/**
 * Archive a subject with all its questions
 */
export async function archiveSubject(subjectId: string, options: ArchiveOptions) {
  const client = await clientPromise;
  const db = client.db();
  
  const subject = await db.collection("subjects").findOne({ _id: new ObjectId(subjectId) });
  if (!subject) throw new Error("Subject not found");

  // Get all questions for this subject
  const questions = await db.collection("questions").find({ subjectId: new ObjectId(subjectId) }).toArray();

  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "subject",
      title: subject.name,
      description: `Subject with ${questions.length} questions`,
      course: subject.course,
      originalId: subjectId,
      originalCollection: "subjects",
      archivedBy: options.userId,
      archivedByName: options.userName,
      archivedByRole: options.userRole,
      reason: options.reason,
      originalData: {
        subject,
        questions // Store all questions with the subject
      },
      itemCount: questions.length,
      tags: options.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive subject");
  }

  // Also delete all questions for this subject
  await db.collection("questions").deleteMany({ subjectId: new ObjectId(subjectId) });

  return response.json();
}

/**
 * Archive a student account
 */
export async function archiveStudent(studentId: string, options: ArchiveOptions) {
  const client = await clientPromise;
  const db = client.db();
  
  const student = await db.collection("users").findOne({ 
    _id: new ObjectId(studentId),
    role: "student"
  });
  
  if (!student) throw new Error("Student not found");

  // Get student's exam results
  const results = await db.collection("examResults").find({ userId: new ObjectId(studentId) }).toArray();

  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "student",
      title: `${student.name} (${student.studentNumber})`,
      description: `Student account with ${results.length} exam results`,
      course: student.course,
      originalId: studentId,
      originalCollection: "users",
      archivedBy: options.userId,
      archivedByName: options.userName,
      archivedByRole: options.userRole,
      reason: options.reason,
      originalData: {
        student: { ...student, passwordHash: undefined }, // Don't store password
        results
      },
      itemCount: results.length,
      tags: options.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive student");
  }

  return response.json();
}

/**
 * Archive a faculty account
 */
export async function archiveFaculty(facultyId: string, options: ArchiveOptions) {
  const client = await clientPromise;
  const db = client.db();
  
  const faculty = await db.collection("users").findOne({ 
    _id: new ObjectId(facultyId),
    role: "faculty"
  });
  
  if (!faculty) throw new Error("Faculty not found");

  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "faculty",
      title: `${faculty.name} (${faculty.department})`,
      description: `Faculty account - ${faculty.course}`,
      course: faculty.course,
      originalId: facultyId,
      originalCollection: "users",
      archivedBy: options.userId,
      archivedByName: options.userName,
      archivedByRole: options.userRole,
      reason: options.reason,
      originalData: { ...faculty, passwordHash: undefined }, // Don't store password
      itemCount: faculty.contributions || 0,
      tags: options.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive faculty");
  }

  return response.json();
}

/**
 * Archive individual questions
 */
export async function archiveQuestions(questionIds: string[], options: ArchiveOptions) {
  const client = await clientPromise;
  const db = client.db();
  
  const objectIds = questionIds.map(id => new ObjectId(id));
  const questions = await db.collection("questions").find({ _id: { $in: objectIds } }).toArray();

  if (questions.length === 0) throw new Error("Questions not found");

  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "questions",
      title: `Question Bank (${questions.length} questions)`,
      description: `Archived question set`,
      course: questions[0]?.course,
      originalId: questionIds[0], // Use first question ID as reference
      originalCollection: "questions",
      archivedBy: options.userId,
      archivedByName: options.userName,
      archivedByRole: options.userRole,
      reason: options.reason,
      originalData: questions,
      itemCount: questions.length,
      tags: options.tags
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive questions");
  }

  // Delete all archived questions
  await db.collection("questions").deleteMany({ _id: { $in: objectIds } });

  return response.json();
}