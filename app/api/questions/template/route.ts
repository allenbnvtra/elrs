import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ─── GET /api/questions/template ─────────────────────────────────────────────
// Returns a downloadable Excel template for bulk question import
export async function GET(_request: NextRequest) {
  try {
    const wb = XLSX.utils.book_new();

    // ── Questions sheet ────────────────────────────────────────────────────────
    const headers = [
      "question_text",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_answer",
      "difficulty",
      "category",
      "course",
      "subject",
      "explanation",
    ];

    const exampleRows = [
      [
        "Calculate the total hydrostatic force on a submerged vertical rectangular gate (2m × 3m) with its top edge 1.5m below the water surface.",
        "85.3 kN",
        "96.2 kN",
        "72.5 kN",
        "108.4 kN",
        "B",
        "Hard",
        "Engineering Science",
        "BSABE",
        "Hydraulics",
        "Use F = ρg·ȳ·A where ȳ is depth to centroid.",
      ],
      [
        "Under RA 8560, define the scope of Geodetic Engineering practice.",
        "Land surveying only",
        "Hydrographic surveys only",
        "All surveying activities including land, geodetic, and cadastral",
        "Environmental impact assessment",
        "C",
        "Medium",
        "Laws & Ethics",
        "BSGE",
        "Professional Practice",
        "RA 8560 covers the full scope of Geodetic Engineering in the Philippines.",
      ],
    ];

    const wsData = [headers, ...exampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [
      { wch: 70 }, // question_text
      { wch: 30 }, // option_a
      { wch: 30 }, // option_b
      { wch: 30 }, // option_c
      { wch: 30 }, // option_d
      { wch: 16 }, // correct_answer
      { wch: 14 }, // difficulty
      { wch: 26 }, // category
      { wch: 12 }, // course
      { wch: 30 }, // subject
      { wch: 45 }, // explanation
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    // ── Instructions sheet ─────────────────────────────────────────────────────
    const instructionRows = [
      ["QUESTION BANK IMPORT TEMPLATE"],
      [""],
      ["REQUIRED COLUMNS (marked with *)"],
      ["question_text    – Full question text (must be unique across entire database)"],
      ["option_a         – Choice A (required)"],
      ["option_b         – Choice B (required)"],
      ["option_c         – Choice C (optional, required if correct_answer = C)"],
      ["option_d         – Choice D (optional, required if correct_answer = D)"],
      ["correct_answer   – One of: A, B, C, D"],
      ["difficulty       – One of: Easy, Medium, Hard"],
      ["category         – e.g. Engineering Science, Laws & Ethics, Mathematics, Surveying"],
      ["course           – One of: BSABE, BSGE"],
      ["subject          – e.g. Hydraulics, Surveying, Professional Practice, Fluid Mechanics"],
      ["explanation      – Optional explanation for the correct answer"],
      [""],
      ["DUPLICATE DETECTION"],
      ["The system performs two duplicate checks before importing each row:"],
      ["  1. Within the uploaded file itself — identical question texts in the same file are skipped."],
      ["  2. Against the existing database — questions already stored are skipped."],
      ["Skipped rows are reported in the import summary. Valid rows are imported automatically."],
      [""],
      ["TIPS"],
      ["• Do NOT modify the column headers in row 1 of the Questions sheet."],
      ["• Delete the example rows (rows 2 and 3) before uploading your data."],
      ["• Correct answer must exactly match A, B, C, or D (case-insensitive)."],
      ["• Maximum 500 questions per upload."],
      ["• Supported file formats: .xlsx, .xls"],
      [""],
      ["AVAILABLE COURSES & SUBJECTS (examples)"],
      ["BSABE: Hydraulics, Fluid Mechanics, Engineering Science, Laws & Ethics, Mathematics, Soil Mechanics"],
      ["BSGE:  Surveying, Geodesy, Professional Practice, Laws & Ethics, Remote Sensing, Cartography"],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(instructionRows);
    wsInfo["!cols"] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

    // ── Serialize to buffer ────────────────────────────────────────────────────
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="questions_import_template.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/questions/template error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}