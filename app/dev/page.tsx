'use client'

import React, { useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Copy,
  Check
} from 'lucide-react'

// Import components to showcase
import { Card } from '@/components/ui/Card'
import {
  ProgramCard,
  ProgramSelectorModal,
  WorkflowStepper,
  GOVERNMENT_PROGRAMS,
  PRE_STARTUP_PROGRAM,
  EARLY_STARTUP_PROGRAM,
} from '@/components/idea-validator/workflow'
import Link from 'next/link'

// Note: SelectionScreen and OnboardingScreen removed from /dev due to side effects
// View them at the main page (/) instead

// Component showcase item
interface ShowcaseItem {
  id: string
  name: string
  description: string
  component: React.ReactNode
  darkBg?: boolean
  fullWidth?: boolean
}

// Section with collapsible items
interface ShowcaseSection {
  id: string
  title: string
  items: ShowcaseItem[]
}

export default function DevPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['workflow', 'ui', 'screens']))
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set())
  const [fullscreenItem, setFullscreenItem] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modal states
  const [showProgramModal, setShowProgramModal] = useState(false)

  // Stable callbacks to prevent infinite loops
  const handleProgramSelect = useCallback((id: string) => alert(`Selected: ${id}`), [])
  const handleModalClose = useCallback(() => setShowProgramModal(false), [])
  const handleModalSelect = useCallback((id: string) => {
    alert(`Selected: ${id}`)
    setShowProgramModal(false)
  }, [])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleItem = (id: string) => {
    setHiddenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyImportPath = (name: string) => {
    const path = `import { ${name} } from '@/components/...'`
    navigator.clipboard.writeText(path)
    setCopiedId(name)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sections: ShowcaseSection[] = [
    {
      id: 'workflow',
      title: 'Workflow Components',
      items: [
        {
          id: 'workflow-stepper',
          name: 'WorkflowStepper',
          description: '워크플로우 진행 상태 표시 (4단계)',
          component: (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-txt-tertiary mb-2">Step 1: Validation</p>
                <WorkflowStepper
                  currentStep="validation"
                  completedSteps={[]}
                  onStepClick={() => {}}
                />
              </div>
              <div>
                <p className="text-xs text-txt-tertiary mb-2">Step 2: PRD (validation complete)</p>
                <WorkflowStepper
                  currentStep="prd"
                  completedSteps={['validation']}
                  onStepClick={() => {}}
                />
              </div>
              <div>
                <p className="text-xs text-txt-tertiary mb-2">Step 4: Export (all complete)</p>
                <WorkflowStepper
                  currentStep="export"
                  completedSteps={['validation', 'prd', 'business-plan']}
                  onStepClick={() => {}}
                />
              </div>
            </div>
          ),
        },
        {
          id: 'program-card-pre',
          name: 'ProgramCard (예비창업)',
          description: '예비창업패키지 카드 - Explore 스타일',
          component: (
            <div className="max-w-sm">
              <ProgramCard
                program={PRE_STARTUP_PROGRAM}
                onSelect={handleProgramSelect}
                isRecommended
              />
            </div>
          ),
        },
        {
          id: 'program-card-early',
          name: 'ProgramCard (초기창업)',
          description: '초기창업패키지 카드',
          component: (
            <div className="max-w-sm">
              <ProgramCard
                program={EARLY_STARTUP_PROGRAM}
                onSelect={handleProgramSelect}
              />
            </div>
          ),
        },
        {
          id: 'program-cards-grid',
          name: 'ProgramCards Grid',
          description: '프로그램 카드 2열 그리드',
          component: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOVERNMENT_PROGRAMS.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onSelect={handleProgramSelect}
                  isRecommended={program.id === 'pre-startup'}
                />
              ))}
            </div>
          ),
          fullWidth: true,
        },
        {
          id: 'program-selector-modal',
          name: 'ProgramSelectorModal',
          description: 'Explore 스타일 프로그램 선택 모달 (버튼 클릭)',
          component: (
            <div>
              <button
                data-testid="open-program-modal-btn"
                onClick={() => setShowProgramModal(true)}
                className="px-4 py-2 bg-surface-inverse text-txt-inverse rounded-sm hover:opacity-90 transition-colors"
              >
                프로그램 선택 모달 열기
              </button>
              <ProgramSelectorModal
                isOpen={showProgramModal}
                onClose={handleModalClose}
                onSelect={handleModalSelect}
                validationScore={75}
              />
            </div>
          ),
        },
      ],
    },
    {
      id: 'ui',
      title: 'UI Components',
      items: [
        {
          id: 'card-default',
          name: 'Card (default)',
          description: '기본 카드 - 호버 시 검정 테두리',
          component: (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <p className="text-sm">Default Card</p>
              </Card>
              <Card variant="technical">
                <p className="text-sm">Technical (dashed)</p>
              </Card>
              <Card variant="flat">
                <p className="text-sm">Flat</p>
              </Card>
            </div>
          ),
        },
        {
          id: 'card-with-title',
          name: 'Card (with title)',
          description: '제목이 있는 카드',
          component: (
            <Card title="Card Title" action={<button className="text-xs text-txt-secondary">Action</button>}>
              <p className="text-sm text-txt-secondary">Card content goes here</p>
            </Card>
          ),
        },
      ],
    },
    {
      id: 'screens',
      title: 'Full Screens (Preview)',
      items: [
        {
          id: 'selection-screen',
          name: 'SelectionScreen',
          description: '레벨 선택 화면 - 실제 확인은 메인 페이지에서',
          component: (
            <div className="p-8 bg-surface-sunken rounded-lg text-center">
              <p className="text-txt-secondary mb-2">SelectionScreen은 메인 플로우에서 확인하세요</p>
              <Link href="/" className="text-txt-secondary underline">메인 페이지로 이동 →</Link>
            </div>
          ),
          fullWidth: true,
        },
        {
          id: 'onboarding-screen',
          name: 'OnboardingScreen',
          description: '온보딩 화면 - 실제 확인은 메인 페이지에서',
          component: (
            <div className="p-8 bg-surface-sunken rounded-lg text-center">
              <p className="text-txt-secondary mb-2">OnboardingScreen은 메인 플로우에서 확인하세요</p>
              <Link href="/" className="text-txt-secondary underline">메인 페이지로 이동 →</Link>
            </div>
          ),
          fullWidth: true,
        },
      ],
    },
  ]

  // Fullscreen modal
  const fullscreenComponent = fullscreenItem
    ? sections.flatMap(s => s.items).find(i => i.id === fullscreenItem)
    : null

  return (
    <div className="min-h-screen bg-[#FAFAFA] bg-grid-engineering">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-txt-primary flex items-center gap-2">
              <span className="bg-surface-inverse text-txt-inverse px-2 py-0.5 rounded-sm text-sm font-mono">DEV</span>
              Component Showcase
            </h1>
            <p className="text-xs text-txt-tertiary mt-1">
              개발/발표용 컴포넌트 미리보기 • {sections.reduce((acc, s) => acc + s.items.length, 0)}개 컴포넌트
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-status-success-text bg-status-success-bg px-2 py-1 rounded-full border border-border">
              localhost:3000/dev
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {sections.map((section) => (
          <section key={section.id} className="bg-surface-card rounded-sm border border-border overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-sunken transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.has(section.id) ? (
                  <ChevronDown size={16} className="text-txt-tertiary" />
                ) : (
                  <ChevronRight size={16} className="text-txt-tertiary" />
                )}
                <h2 className="font-bold text-txt-primary">{section.title}</h2>
                <span className="text-[10px] font-mono text-txt-tertiary bg-surface-sunken px-2 py-0.5 rounded-sm">
                  {section.items.length} items
                </span>
              </div>
            </button>

            {/* Section Items */}
            {expandedSections.has(section.id) && (
              <div className="border-t border-border-subtle">
                {section.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`${index > 0 ? 'border-t border-border-subtle' : ''}`}
                  >
                    {/* Item Header */}
                    <div className="px-6 py-3 bg-surface-sunken flex items-center justify-between">
                      <div>
                        <h3 className="font-mono text-sm font-bold text-txt-primary">{item.name}</h3>
                        <p className="text-xs text-txt-tertiary">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyImportPath(item.name)}
                          className="p-1.5 hover:bg-surface-sunken rounded-sm transition-colors"
                          title="Copy import"
                        >
                          {copiedId === item.name ? (
                            <Check size={14} className="text-status-success-text" />
                          ) : (
                            <Copy size={14} className="text-txt-tertiary" />
                          )}
                        </button>
                        <button
                          onClick={() => setFullscreenItem(item.id)}
                          className="p-1.5 hover:bg-surface-sunken rounded-sm transition-colors"
                          title="Fullscreen"
                        >
                          <Maximize2 size={14} className="text-txt-tertiary" />
                        </button>
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="p-1.5 hover:bg-surface-sunken rounded-sm transition-colors"
                          title={hiddenItems.has(item.id) ? 'Show' : 'Hide'}
                        >
                          {hiddenItems.has(item.id) ? (
                            <EyeOff size={14} className="text-txt-tertiary" />
                          ) : (
                            <Eye size={14} className="text-txt-tertiary" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Item Content */}
                    {!hiddenItems.has(item.id) && (
                      <div
                        data-testid={item.id}
                        className={`p-6 ${item.darkBg ? 'bg-gray-900' : 'bg-surface-card'}`}
                      >
                        <div className={item.fullWidth ? '' : 'max-w-2xl'}>
                          {item.component}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Fullscreen Modal */}
      {fullscreenComponent && (
        <div className="fixed inset-0 z-50 bg-surface-card overflow-auto">
          <div className="sticky top-0 bg-surface-card border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-mono font-bold text-txt-primary">{fullscreenComponent.name}</h2>
              <p className="text-xs text-txt-tertiary">{fullscreenComponent.description}</p>
            </div>
            <button
              onClick={() => setFullscreenItem(null)}
              className="px-4 py-2 bg-surface-inverse text-txt-inverse text-sm rounded-sm hover:opacity-90"
            >
              Close
            </button>
          </div>
          <div className="p-8">
            {fullscreenComponent.component}
          </div>
        </div>
      )}
    </div>
  )
}
