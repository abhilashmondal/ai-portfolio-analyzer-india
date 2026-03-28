import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function useExportPdf() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async (elementId: string, filename: string = 'portfolio-analysis.pdf') => {
    try {
      setIsExporting(true);
      const element = document.getElementById(elementId);
      
      if (!element) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      // Add a temporary class to fix styling issues during export if needed
      element.classList.add('pdf-export-mode');

      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0e17', // Match dark background
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      element.classList.remove('pdf-export-mode');

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate aspect ratio to fit on A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If content is longer than one page, we just scale it to fit or let it cut off gracefully for dashboard
      // A better approach for multi-page is complex, but for a single dashboard view, fitting to width is standard
      let currentHeight = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPdf, isExporting };
}
