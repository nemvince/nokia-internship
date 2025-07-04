import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.name || !body.email) {
            return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 })
        }

        try {
            const contact = await prisma.contact.create({
                data: {
                    name: body.name,
                    email: body.email,
                }
            })

            return NextResponse.json({ success: true, data: contact }, { status: 201 })
        } catch (error) {
            console.error("Prisma error", error)
            return NextResponse.json({ success: false, message: "Something went wrong with the database. :("}, { status: 500 })
        }

    } catch (error) {
        console.error("Error creating contact:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const contacts = await prisma.contact.findMany({ orderBy: {
            createdAt: 'asc'
        }})

        return NextResponse.json({ success: true, data: contacts })
    } catch (error) {
        console.error("Error fetching contacts:", error)
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
    }
}
