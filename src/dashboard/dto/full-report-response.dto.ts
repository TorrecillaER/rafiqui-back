import { ApiProperty } from '@nestjs/swagger';

export class FullReportResponseDto {
  @ApiProperty({
    description: 'Unique report identifier',
    example: 'RAFIQUI-RPT-A1B2C3D4',
  })
  reportId: string;

  @ApiProperty({
    description: 'Report generation date',
    example: '2025-01-15T19:35:00.000Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Report period start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  periodStart: Date;

  @ApiProperty({
    description: 'Report period end date',
    example: '2025-01-15T00:00:00.000Z',
  })
  periodEnd: Date;

  @ApiProperty({
    description: 'PDF file as base64 encoded string',
    example: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==',
  })
  pdfBase64: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 125678,
  })
  fileSizeBytes: number;

  @ApiProperty({
    description: 'Number of pages in the report',
    example: 6,
  })
  pageCount: number;
}
