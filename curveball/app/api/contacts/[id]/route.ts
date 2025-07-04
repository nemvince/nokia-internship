import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    await prisma.contact.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    const updatedContact = await prisma.contact.update({
        where: { id },
        data: body
    })

    return NextResponse.json({ success: true, updatedContact })
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
