import { mkdir, readdir, writeFile, readFile, rm, stat } from 'fs/promises'
import { join, extname } from 'path'
import type { CreateReportRequest } from '../types/report.js'

interface ReportMetadata {
  name: string
  createdAt: string
  updatedAt: string
}

interface UploadedFile {
  filename: string
  path: string
}

export class ReportService {
  constructor(private readonly rootDir: string) {}

  async createReport(projectId: string, report: CreateReportRequest): Promise<ReportMetadata> {
    const projectPath = this.getProjectPath(projectId)
    const reportPath = join(projectPath, 'reports')
    const reportFilePath = join(reportPath, `${report.name}.json`)

    // Create reports directory if it doesn't exist
    await mkdir(reportPath, { recursive: true })

    const metadata: ReportMetadata = {
      name: report.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save report content with metadata
    const reportData = {
      ...report.content,
      _metadata: metadata
    }

    await writeFile(reportFilePath, JSON.stringify(reportData, null, 2))
    return metadata
  }

  async listReports(projectId: string): Promise<ReportMetadata[]> {
    const reportPath = join(this.getProjectPath(projectId), 'reports')

    try {
      const files = await readdir(reportPath)
      const reports: ReportMetadata[] = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const reportData = await this.readReportFile(projectId, file.replace('.json', ''))
          if (reportData._metadata) {
            reports.push(reportData._metadata)
          }
        }
      }

      return reports
    } catch (error) {
      return []
    }
  }

  async getReport(projectId: string, reportName: string): Promise<any> {
    return await this.readReportFile(projectId, reportName)
  }

  async updateReport(projectId: string, reportName: string, content: any): Promise<ReportMetadata> {
    const reportPath = join(this.getProjectPath(projectId), 'reports', `${reportName}.json`)
    
    const existingReport = await this.readReportFile(projectId, reportName)
    const metadata: ReportMetadata = {
      ...existingReport._metadata,
      updatedAt: new Date().toISOString()
    }

    const reportData = {
      ...content,
      _metadata: metadata
    }

    await writeFile(reportPath, JSON.stringify(reportData, null, 2))
    return metadata
  }

  async deleteReport(projectId: string, reportName: string): Promise<void> {
    const reportPath = join(this.getProjectPath(projectId), 'reports', `${reportName}.json`)
    await rm(reportPath)
  }

  async uploadFiles(projectId: string, reportName: string, files: File[]): Promise<UploadedFile[]> {
    const reportPath = join(this.getProjectPath(projectId), 'reports', reportName)
    const allureResultsPath = join(reportPath, 'allure-results')
    await mkdir(allureResultsPath, { recursive: true })

    const uploadedFiles: UploadedFile[] = []

    for (const file of files) {
      const filePath = join(allureResultsPath, file.name)
      
      const arrayBuffer = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(arrayBuffer))

      uploadedFiles.push({
        filename: file.name,
        path: `reports/${reportName}/allure-results/${file.name}`
      })
    }

    return uploadedFiles
  }

  private sanitizeFilename(filename: string): string {
    // Remove any path traversal characters and invalid filename characters
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = extname(sanitized)
    const base = sanitized.slice(0, -ext.length)
    
    // Add timestamp to ensure uniqueness
    return `${base}_${Date.now()}${ext}`
  }

  private getProjectPath(projectId: string): string {
    // Remove any 'storage' prefix from projectId if it exists
    const normalizedProjectId = projectId.replace(/^storage\//, '')
    return join(this.rootDir, normalizedProjectId)
  }

  private async readReportFile(projectId: string, reportName: string): Promise<any> {
    const reportPath = join(this.getProjectPath(projectId), 'reports', `${reportName}.json`)
    const content = await readFile(reportPath, 'utf-8')
    return JSON.parse(content)
  }

  async generateAllureReport(projectId: string, reportName: string): Promise<{ outputDir: string }> {
    const reportPath = join(this.getProjectPath(projectId), 'reports', reportName)
    const allureResultsPath = join(reportPath, 'allure-results')
    const allureReportPath = join(reportPath, 'allure-report')

    // Ensure allure-results directory exists
    await mkdir(allureResultsPath, { recursive: true })

    try {
      const allure = (await import('allure-commandline')).default
      await allure(['generate', allureResultsPath, '-o', allureReportPath])
      return {
        outputDir: allureReportPath
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to generate Allure report: ${errorMessage}`)
    }
  }

  async getAllureReportPath(projectId: string, reportName: string): Promise<string> {
    const reportPath = join(this.getProjectPath(projectId), 'reports', reportName)
    const allureReportPath = join(reportPath, 'allure-report')
    
    try {
      // Check if the report directory exists
      await stat(allureReportPath)
      return allureReportPath
    } catch (error) {
      throw new Error('Allure report not found. Please generate it first.')
    }
  }
} 