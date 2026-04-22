import type { DocLandPlugin } from './plugin.interface.js';
import { storageService } from '../services/storage.service.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

interface OCRResult {
  success: boolean;
  text_blocks: Array<{
    text: string;
    confidence: number;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  tables: Array<any>;
  layout: {
    headers: Array<any>;
    paragraphs: Array<any>;
    lists: Array<any>;
    columns: Array<any>;
  };
  html: string;
  plain_text: string;
}

export class OCRPlugin implements DocLandPlugin {
  id = 'ocr-scanner';
  name = 'OCR Scanner';
  description = 'Сканирует изображения документов, извлекает текст, таблицы, структуру и создает HTML-копию';
  supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
  
  private ocrServiceUrl: string;

  constructor() {
    this.ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://ocr-service:8000';
  }

  registerMcpTools(mcpServer: McpServer): void {
    // Инструмент сканирования документа
    mcpServer.tool(
      'scan_document',
      'Сканирует изображение документа и извлекает текст, таблицы, структуру и HTML',
      { file_id: z.string() },
      async ({ file_id }) => {
        try {
          const result = await this.scanImage(file_id);
          return {
            content: [{
              type: 'text',
              text: `Document scanned successfully.\n\nText: ${result.plain_text.substring(0, 500)}...\n\nTables found: ${result.tables.length}\nHeaders: ${result.layout.headers.length}\nParagraphs: ${result.layout.paragraphs.length}\n\nHTML structure created.`
            }]
          };
        } catch (e: any) {
          return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    // Инструмент извлечения текста
    mcpServer.tool(
      'extract_text',
      'Извлекает только текст из изображения',
      { file_id: z.string() },
      async ({ file_id }) => {
        try {
          const text = await this.extractImageText(file_id);
          return { content: [{ type: 'text', text }] };
        } catch (e: any) {
          return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    // Инструмент копирования структуры
    mcpServer.tool(
      'copy_document_structure',
      'Копирует структуру документа как HTML',
      { file_id: z.string() },
      async ({ file_id }) => {
        try {
          const result = await this.copyDocumentStructure(file_id);
          return {
            content: [{
              type: 'text',
              text: `Document structure copied.\n\nHTML:\n${result.html.substring(0, 1000)}...\n\nText:\n${result.text.substring(0, 500)}...`
            }]
          };
        } catch (e: any) {
          return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    // Инструмент описания изображения
    mcpServer.tool(
      'describe_image',
      'Описывает содержимое изображения',
      { file_id: z.string() },
      async ({ file_id }) => {
        try {
          const description = await this.describeImage(file_id);
          return { content: [{ type: 'text', text: description }] };
        } catch (e: any) {
          return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
      }
    );
  }

  async execute(fileId: string, doc: any, actor?: 'USER' | 'BOT', data?: any): Promise<any> {
    // Для UI - сканирование и создание нового документа
    const result = await this.scanImage(fileId);
    return result;
  }

  /**
   * Сканирует изображение и возвращает структурированные данные
   */
  async scanImage(fileId: string): Promise<OCRResult> {
    const doc = storageService.getDocument(fileId);
    if (!doc) throw new Error('Document not found');

    const filePath = storageService.getFilePath(fileId, doc.currentRevisionId, 'original');
    if (!fs.existsSync(filePath)) throw new Error('File not found');

    return await this.callOCRService(filePath, 'scan') as OCRResult;
  }

  /**
   * Извлекает текст из изображения
   */
  async extractImageText(fileId: string): Promise<string> {
    const doc = storageService.getDocument(fileId);
    if (!doc) throw new Error('Document not found');

    const filePath = storageService.getFilePath(fileId, doc.currentRevisionId, 'original');
    if (!fs.existsSync(filePath)) throw new Error('File not found');

    const result = await this.callOCRService(filePath, 'extract-text');
    return result.text || result.plain_text || '';
  }

  /**
   * Копирует структуру документа как HTML
   */
  async copyDocumentStructure(fileId: string): Promise<{ html: string; text: string }> {
    const result = await this.scanImage(fileId);
    return {
      html: result.html,
      text: result.plain_text
    };
  }

  /**
   * Описывает изображение
   */
  async describeImage(fileId: string): Promise<string> {
    const doc = storageService.getDocument(fileId);
    if (!doc) throw new Error('Document not found');

    const filePath = storageService.getFilePath(fileId, doc.currentRevisionId, 'original');
    if (!fs.existsSync(filePath)) throw new Error('File not found');

    const result = await this.callOCRService(filePath, 'describe');
    return result.description || 'No description available';
  }

  /**
   * Вызывает OCR сервис
   */
  private async callOCRService(filePath: string, endpoint: string): Promise<any> {
    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      
      form.append('file', fs.createReadStream(filePath));
      
      const response = await fetch(`${this.ocrServiceUrl}/${endpoint}`, {
        method: 'POST',
        body: form as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OCR service error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[OCR Plugin] Service call failed:', error);
      throw new Error(`OCR service unavailable: ${error.message}`);
    }
  }
}