import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Extend jsPDF with autoTable type for backward compatibility or direct use if needed
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ExportData {
  headers: string[]
  rows: any[][]
  filename: string
  title: string
}

/**
 * Export data to CSV format
 */
export function exportToCSV({ headers, rows, filename }: ExportData) {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => {
      // Escape commas and wrap in quotes if necessary
      const val = String(cell).replace(/"/g, '""')
      return val.includes(",") ? `"${val}"` : val
    }).join(","))
  ].join("\n")

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export data to PDF format
 */
export async function exportToPDF({ headers, rows, filename, title }: ExportData) {
  const doc = new jsPDF()

  // Add Title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text(title, 14, 22)

  // Add Date
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, 14, 30)

  // Add Table
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { 
      fillColor: [100, 80, 50], // Approximating brand-croissant
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold"
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 240]
    },
    margin: { top: 35 },
  })

  // Save the PDF
  doc.save(`${filename}.pdf`)
}

/**
 * Export combined data (Ingresos and Gastos) to CSV
 */
export function exportCombinedCSV({ headers, rows, filename }: ExportData) {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => {
      const val = String(cell).replace(/"/g, '""')
      return val.includes(",") ? `"${val}"` : val
    }).join(","))
  ].join("\n")

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export combined data (Ingresos and Gastos) to PDF
 */
export async function exportCombinedPDF({ headers, rows, filename, title }: ExportData) {
  const doc = new jsPDF()

  // Add Title
  doc.setFontSize(22)
  doc.setTextColor(100, 80, 50) // Brand color
  doc.text(title, 14, 22)

  // Add Generation Date
  doc.setFontSize(10)
  doc.setTextColor(150)
  doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, 14, 28)

  // Add Table
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { 
      fillColor: [100, 80, 50],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold"
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: [50, 50, 50],
      cellPadding: 3
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        // Index 2 is Ingreso, Index 3 is Egreso
        const isIngreso = data.row.cells[2]?.text[0] !== ''
        const isEgreso = data.row.cells[3]?.text[0] !== ''
        
        if (isIngreso) {
          data.cell.styles.textColor = [0, 100, 0] // Dark Green
        } else if (isEgreso) {
          data.cell.styles.textColor = [150, 0, 0] // Dark Red
        }
      }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 245]
    },
    margin: { top: 35, left: 14, right: 14 },
  })

  // Add Footer with Summary
  const finalY = (doc as any).lastAutoTable.finalY || 35
  
  // Improved ARS amount parsing
  const parseAmount = (val: any) => {
    if (typeof val === 'number') return val
    const s = String(val).trim()
    // Remove currency symbols, spaces, and thousands separators (.)
    // Then replace decimal comma with dot
    const cleaned = s
      .replace(/[^\d,+-]/g, "") // Remove everything except digits, comma, plus, minus
      .replace(",", ".")        // Replace ARS decimal comma with dot
    return parseFloat(cleaned) || 0
  }

  const sumIngresos = rows.reduce((acc: number, r: any[]) => acc + parseAmount(r[2]), 0)
  const sumGastos = rows.reduce((acc: number, r: any[]) => acc + parseAmount(r[3]), 0)

  doc.setFontSize(12)
  doc.setTextColor(50)
  doc.text(`Total Ingresos: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(sumIngresos)}`, 14, finalY + 15)
  doc.setTextColor(150, 0, 0)
  doc.text(`Total Gastos: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(sumGastos)}`, 14, finalY + 22)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(100, 80, 50)
  doc.text(`Balance Neto: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(sumIngresos - sumGastos)}`, 14, finalY + 32)

  // Save the PDF
  doc.save(`${filename}.pdf`)
}
