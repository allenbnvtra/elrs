import { ObjectId, Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";

export type MaterialType = "document" | "video";
export type CourseType = "BSGE" | "BSABEN";

export interface ReviewMaterial {
  _id?: ObjectId;
  title: string;
  description?: string;
  type: MaterialType;
  course: CourseType;
  subject: string;
  
  // For documents (PDF)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number; // in bytes
  
  // For videos (link)
  videoUrl?: string;
  videoDuration?: string; // format: "45:20"
  
  // Metadata
  uploadedBy: ObjectId; // User ID
  uploadedByName: string;
  uploadedByRole: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection(): Promise<Collection<ReviewMaterial>> {
  const client = await clientPromise;
  return client.db().collection<ReviewMaterial>("reviewMaterials");
}

export { getCollection };