// src/utils/fileExtractor.util.ts
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export const extractContentFromFile = async (file: Express.Multer.File): Promise<string | null> => {
  try {
    let content = '';

    switch (file.mimetype) {
      case 'application/pdf':
        const pdfData = await pdfParse(file.buffer);
        content = pdfData.text;
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        content = result.value;
        break;

      case 'text/plain':
        content = file.buffer.toString('utf-8');
        break;

      default:
        return null;
    }

    // Clean và normalize content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim();

    return content;
  } catch (error) {
    console.error('Error extracting content from file:', error);
    return null;
  }
};
