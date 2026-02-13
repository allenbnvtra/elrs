import { ObjectId } from "mongodb";

export type ArchiveType = "exam" | "material" | "questions" | "subject" | "student" | "faculty";
export type CourseType = "BSGE" | "BSABEN";

export interface Archive {
  _id?: ObjectId;
  
  // Archive metadata
  type: ArchiveType;
  title: string;
  description?: string;
  course?: CourseType;
  
  // Original data reference
  originalId: ObjectId;  // ID of the original item before archiving
  originalCollection: string;  // Collection where it came from (e.g., "exams", "materials")
  
  // Archive details
  archivedBy: ObjectId;  // User ID who archived it
  archivedByName: string;
  archivedByRole: string;
  archivedAt: Date;
  reason?: string;  // Why it was archived
  
  // Original data snapshot (store the full original document)
  originalData: any;  // Complete snapshot of the original document
  
  // Statistics
  itemCount?: number;  // For exams: question count, for materials: file count
  
  // Metadata
  tags?: string[];
  canRestore: boolean;  // Whether this can be restored
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchiveStats {
  totalArchived: number;
  byType: {
    exam: number;
    material: number;
    questions: number;
    subject: number;
    student: number;
    faculty: number;
  };
  byCourse: {
    BSABEN: number;
    BSGE: number;
  };
  recentlyArchived: number; // Last 30 days
}