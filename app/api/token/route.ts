import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 현재 사용자 토큰 반환 (없으면 자동 생성)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_tokens")
    .select("share_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data) return NextResponse.json({ token: data.share_token });

  // 없으면 새로 생성
  const { data: created, error: insertErr } = await supabase
    .from("user_tokens")
    .insert({ user_id: user.id })
    .select("share_token")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ token: created.share_token });
}

// POST: 토큰 재발급
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 기존 삭제 후 재생성
  await supabase.from("user_tokens").delete().eq("user_id", user.id);

  const { data, error } = await supabase
    .from("user_tokens")
    .insert({ user_id: user.id })
    .select("share_token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data.share_token });
}
