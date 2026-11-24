import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).populate("customerId", "name email");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdfBuffer = await new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(22).text("NEXVIA MULTI-VENDOR MARKETPLACE", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(12).text("Official Tax Invoice & Split-Payment Receipt", { align: "center" });
      doc.moveDown(1.5);

      doc.fontSize(11).text(`Order ID: ${order._id}`);
      doc.text(`Payment Ref: ${order.paymentId}`);
      doc.text(`Customer: ${order.customerId?.name || "Customer"} (${order.customerId?.email || ""})`);
      doc.text(`Order Status: ${order.status.toUpperCase()}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
      doc.moveDown(1.5);

      doc.fontSize(13).text("Purchased Items:", { underline: true });
      doc.moveDown(0.5);

      order.items.forEach((item, idx) => {
        doc
          .fontSize(11)
          .text(
            `${idx + 1}. ${item.title}  |  Qty: ${item.quantity}  x  $${item.price.toFixed(2)}  =  $${(
              item.price * item.quantity
            ).toFixed(2)}`
          );
      });

      doc.moveDown(1.5);
      doc.fontSize(14).text(`Total Paid: $${order.totalAmount.toFixed(2)}`, { bold: true });
      doc.fontSize(10).text(`(Includes 10% Platform Commission & 90% Automated Vendor Split)`);

      doc.end();
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order._id}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}