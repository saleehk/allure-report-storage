import { mkdir, readdir, rm } from 'fs/promises'
import { join } from 'path'

export class ProjectService {
  constructor(private readonly rootDir: string) {}

  async createProject(name: string): Promise<void> {
    const projectPath = this.getProjectPath(name)
    await mkdir(projectPath, { recursive: true })
  }

  async listProjects(): Promise<string[]> {
    try {
      return await readdir(this.rootDir)
    } catch (error) {
      return []
    }
  }

  async deleteProject(name: string): Promise<void> {
    const projectPath = this.getProjectPath(name)
    await rm(projectPath, { recursive: true, force: true })
  }

  private getProjectPath(name: string): string {
    return join(this.rootDir, name)
  }
} 