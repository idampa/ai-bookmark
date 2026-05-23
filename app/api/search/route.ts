import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchBookmarks } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await request.json();
  if (!query?.trim()) {
    return NextResponse.json({ ids: [], reasoning: "" });
  }

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, title, summary, tags")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = await searchBookmarks(query, bookmarks || []);
  return NextResponse.json(result);
}
