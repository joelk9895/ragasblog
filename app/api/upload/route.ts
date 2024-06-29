import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function writeMdFile(
  content: string,
  filename: string
): Promise<NextResponse> {
  try {
    const mdFilename = filename.endsWith(".mdx") ? filename : `${filename}.mdx`;

    // Write the content to a blob
    const blob = await put(mdFilename, content, {
      access: "public",
    });
    return NextResponse.json(blob);
  } catch (error) {
    // Handle any errors
    console.error("Error writing MD file:", error);
    return NextResponse.json(
      { error: "Failed to write MD file" },
      { status: 500 }
    );
  }
}
