import type { DocProject } from './types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateName(name: string): ValidationResult {
  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    return {
      valid: false,
      errors: [
        `Invalid name "${name}": name must contain only alphanumeric characters and hyphens.`,
      ],
    }
  }
  return { valid: true, errors: [] }
}

export function validatePath(path: string): ValidationResult {
  const errors: string[] = []
  if (!path.startsWith('/')) {
    errors.push(`Invalid path "${path}": path must start with "/".`)
  }
  if (!path.endsWith('/')) {
    errors.push(`Invalid path "${path}": path must end with "/".`)
  }
  return { valid: errors.length === 0, errors }
}

export function validateDocProject(project: DocProject): ValidationResult {
  const nameResult = validateName(project.name)
  const pathResult = validatePath(project.path)
  const errors = [...nameResult.errors, ...pathResult.errors]
  return { valid: errors.length === 0, errors }
}
