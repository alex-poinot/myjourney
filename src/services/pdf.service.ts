import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  
  async exportToPdf(elementId: string, filename: string = 'document.pdf'): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Configuration pour une meilleure qualité
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Format A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Marges pour header et footer
      const headerHeight = 15;
      const footerHeight = 15;
      const contentHeight = pageHeight - headerHeight - footerHeight;
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      // Fonction pour ajouter header
      const addHeader = () => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('GRANT THORNTON', pageWidth / 2, 10, { align: 'center' });
      };

      // Fonction pour ajouter footer
      const addFooter = (currentPage: number, totalPages: number) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${currentPage} sur ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      };

      // Calculer le nombre total de pages
      const totalPages = Math.ceil(imgHeight / contentHeight);

      // Première page
      addHeader();
      pdf.addImage(imgData, 'PNG', 0, headerHeight, imgWidth, imgHeight);
      addFooter(pageNumber, totalPages);
      heightLeft -= contentHeight;

      // Pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pageNumber++;
        
        addHeader();
        pdf.addImage(imgData, 'PNG', 0, headerHeight + position, imgWidth, imgHeight);
        addFooter(pageNumber, totalPages);
        
        heightLeft -= contentHeight;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }
}