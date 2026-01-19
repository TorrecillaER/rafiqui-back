import { ApiProperty } from '@nestjs/swagger';

export class CertificateResponseDto {
  @ApiProperty({
    description: 'Unique certificate identifier',
    example: 'RAFIQUI-ESG-A1B2C3D4',
  })
  certificateId: string;

  @ApiProperty({
    description: 'Certificate issue date',
    example: '2025-01-15T18:35:00.000Z',
  })
  issuedAt: Date;

  @ApiProperty({
    description: 'Partner or user name',
    example: 'Empresa Solar México',
  })
  partnerName: string;

  @ApiProperty({
    description: 'PDF file as base64 encoded string',
    example: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==',
  })
  pdfBase64: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 45678,
  })
  fileSizeBytes: number;
}
