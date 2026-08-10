// TODO: Enable/disable PPPoE pelanggan (auto jatuh tempo / manual)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
