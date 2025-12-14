"use client"

import { useState, useRef, useEffect, ReactNode } from 'react'
import { LiquidButton, HoverMorph } from './AdvancedAnimations'

// Advanced Form Field Component
interface FormFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  success?: boolean
  required?: boolean
  placeholder?: string
  icon?: ReactNode
  helperText?: string
  disabled?: boolean
  multiline?: boolean
  rows?: number
  options?: Array<{ value: string; label: string }>
  className?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  required,
  placeholder,
  icon,
  helperText,
  disabled,
  multiline,
  rows = 3,
  options,
  className = ''
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(!!value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  useEffect(() => {
    setHasValue(!!value)
  }, [value])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const inputClasses = `
    w-full px-4 py-3 text-base bg-surface-primary border-2 rounded-xl transition-all duration-300 outline-none
    ${error ? 'border-error-500 focus:border-error-500' : ''}
    ${success ? 'border-success-500 focus:border-success-500' : ''}
    ${!error && !success ? 'border-surface-tertiary focus:border-primary-500' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${icon ? 'pl-12' : ''}
  `

  const labelClasses = `
    absolute left-4 transition-all duration-300 pointer-events-none
    ${icon ? 'left-12' : ''}
    ${isFocused || hasValue
      ? 'top-1 text-sm font-medium'
      : 'top-1/2 -translate-y-1/2 text-base'
    }
    ${error ? 'text-error-500' : ''}
    ${success ? 'text-success-500' : ''}
    ${(!error && !success) ? (isFocused || hasValue ? 'text-primary-600' : 'text-content-tertiary') : ''}
  `

  return (
    <HoverMorph className={`relative ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-tertiary z-10">
          {icon}
        </div>
      )}

      {/* Input/Select/Textarea */}
      <div className="relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${inputClasses} resize-none`}
            required={required}
          />
        ) : options ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={`${inputClasses} cursor-pointer`}
            required={required}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            required={required}
          />
        )}

        {/* Floating Label */}
        <label className={labelClasses}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>

        {/* Success/Error Icons */}
        {(error || success) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {error && (
              <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {success && (
              <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Helper Text / Error Message */}
      {(helperText || error) && (
        <div className={`mt-2 text-sm transition-all duration-300 ${
          error ? 'text-error-600' : 'text-content-tertiary'
        }`}>
          {error || helperText}
        </div>
      )}
    </HoverMorph>
  )
}

// Advanced Password Input with Strength Indicator
interface PasswordFieldProps extends Omit<FormFieldProps, 'type'> {
  showStrength?: boolean
  onStrengthChange?: (strength: number) => void
}

export function PasswordField({
  showStrength = true,
  onStrengthChange,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [strength, setStrength] = useState(0)

  const calculateStrength = (password: string): number => {
    let score = 0
    if (password.length >= 8) score += 25
    if (/[a-z]/.test(password)) score += 25
    if (/[A-Z]/.test(password)) score += 25
    if (/[0-9]/.test(password)) score += 15
    if (/[^A-Za-z0-9]/.test(password)) score += 10
    return Math.min(score, 100)
  }

  useEffect(() => {
    const newStrength = calculateStrength(props.value)
    setStrength(newStrength)
    onStrengthChange?.(newStrength)
  }, [props.value, onStrengthChange])

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-error-500'
    if (strength < 50) return 'bg-warning-500'
    if (strength < 75) return 'bg-warning-400'
    return 'bg-success-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Weak'
    if (strength < 50) return 'Fair'
    if (strength < 75) return 'Good'
    return 'Strong'
  }

  return (
    <div className="space-y-2">
      <FormField
        {...props}
        type={showPassword ? 'text' : 'password'}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
      />

      {/* Password Toggle & Strength */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          {showPassword ? 'Hide' : 'Show'} password
        </button>

        {showStrength && props.value && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-content-tertiary">
              {getStrengthText(strength)}
            </div>
            <div className="w-16 h-1 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// File Upload Component with Drag & Drop
interface FileUploadProps {
  label: string
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  onChange: (files: File[]) => void
  error?: string
  className?: string
  preview?: boolean
}

export function FileUpload({
  label,
  accept = "*",
  multiple = false,
  maxSize = 10,
  onChange,
  error,
  className = '',
  preview = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles: File[]) => {
    // Validate file sizes
    const validFiles = newFiles.filter(file => {
      const sizeInMB = file.size / (1024 * 1024)
      return sizeInMB <= maxSize
    })

    if (validFiles.length !== newFiles.length) {
      // Handle size validation error
      console.warn(`Some files exceed the ${maxSize}MB limit`)
    }

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  return (
    <HoverMorph className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-content-primary">
        {label}
      </label>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragOver ? 'border-primary-500 bg-primary-50' : 'border-surface-tertiary hover:border-primary-400'}
          ${error ? 'border-error-500' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-4xl">
            {isDragOver ? '📂' : '📎'}
          </div>
          <div>
            <p className="text-lg font-medium text-content-primary">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-content-tertiary mt-1">
              {accept === "*" ? "Any file type" : accept} • Max {maxSize}MB {multiple ? "each" : "per file"}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {file.type.startsWith('image/') ? '🖼️' :
                   file.type.startsWith('video/') ? '🎥' :
                   file.type.startsWith('audio/') ? '🎵' :
                   '📄'}
                </div>
                <div>
                  <p className="font-medium text-content-primary">{file.name}</p>
                  <p className="text-sm text-content-tertiary">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 text-content-tertiary hover:text-error-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-error-600">
          {error}
        </div>
      )}
    </HoverMorph>
  )
}

// Advanced Multi-Step Form Component
interface Step {
  title: string
  description?: string
  fields: ReactNode
}

interface MultiStepFormProps {
  steps: Step[]
  onSubmit: (data: Record<string, any>) => void
  className?: string
}

export function MultiStepForm({ steps, onSubmit, className = '' }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <HoverMorph className={`max-w-2xl mx-auto ${className}`}>
      <div className="card-modern p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-content-primary">
              {steps[currentStep].title}
            </h2>
            <span className="text-sm text-content-tertiary">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <div className="w-full bg-surface-tertiary rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {steps[currentStep].description && (
            <p className="text-content-secondary mt-4">
              {steps[currentStep].description}
            </p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                index <= currentStep ? 'bg-primary-500' : 'bg-surface-tertiary'
              }`}
            />
          ))}
        </div>

        {/* Form Fields */}
        <div className="mb-8">
          {steps[currentStep].fields}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 text-content-secondary hover:text-content-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <LiquidButton onClick={handleSubmit}>
              Complete Setup
            </LiquidButton>
          ) : (
            <LiquidButton onClick={nextStep}>
              Next Step
            </LiquidButton>
          )}
        </div>
      </div>
    </HoverMorph>
  )
}

// Advanced Search/Filter Component
interface SearchFilterProps {
  placeholder?: string
  filters?: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
  onSearch: (query: string, filters: Record<string, string>) => void
  className?: string
}

export function SearchFilter({
  placeholder = "Search...",
  filters = [],
  onSearch,
  className = ''
}: SearchFilterProps) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    onSearch(query, activeFilters)
  }, [query, activeFilters, onSearch])

  const updateFilter = (key: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setActiveFilters({})
    setQuery('')
  }

  const activeFilterCount = Object.values(activeFilters).filter(v => v).length

  return (
    <HoverMorph className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-surface-primary border-2 border-surface-tertiary rounded-xl focus:border-primary-500 transition-all duration-300"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-tertiary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Active Filters */}
      {(query || activeFilterCount > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {query && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              "{query}"
              <button
                onClick={() => setQuery('')}
                className="hover:bg-primary-200 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null
            const filter = filters.find(f => f.key === key)
            const option = filter?.options.find(o => o.value === value)
            return (
              <span key={key} className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                {filter?.label}: {option?.label}
                <button
                  onClick={() => updateFilter(key, '')}
                  className="hover:bg-secondary-200 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )
          })}

          {(query || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm text-content-tertiary hover:text-content-primary transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && filters.length > 0 && (
        <div className="card-modern p-6 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-content-primary mb-2">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => updateFilter(filter.key, e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-surface-tertiary rounded-lg focus:border-primary-500 transition-colors"
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </HoverMorph>
  )
}
