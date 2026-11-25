import { useMemo, useRef, useState } from 'react'
import React from 'react';
import {
  Activity, AlertCircle, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight,
  Bug, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  ClipboardList, Clock3, Code2, FileText, Gauge, ImagePlus, LayoutDashboard,
  Lightbulb, ListChecks, Menu, MessageCircle, Paperclip, Plus, Search,
  Send, ShieldCheck, Sparkles, Terminal, UploadCloud, WandSparkles, X
} from 'lucide-react'

const initialIssue = {
  title: '',
  description: '',
  module: 'Cadastro de despesas',
  environment: 'Homologação',
  browser: 'Google Chrome',
  frequency: 'Sempre acontece',
  expected: '',
  observed: '',
  steps: '',
}

const demoIssue = {
  title: 'Falha ao cadastrar despesa',
  description: 'Ao tentar cadastrar uma despesa, o sistema apresenta uma mensagem de erro e não conclui a operação.',
  module: 'Financeiro',
  environment: 'Homologação',
  browser: 'Google Chrome',
  frequency: 'Sempre acontece',
  expected: 'A despesa deve ser salva e aparecer na listagem.',
  observed: 'Uma mensagem de erro é exibida e o cadastro não é concluído.',
  steps: 'Acessar Financeiro > Despesas, preencher os campos obrigatórios e clicar em Salvar.',
}

const questions = [
  { key: 'steps', question: 'Quais passos você executou imediatamente antes de perceber o erro?', hint: 'Descreva a sequência de ações, desde o acesso à tela até a falha.', placeholder: 'Ex.: Acessei Financeiro > Despesas, cliquei em Nova despesa...' },
  { key: 'expected', question: 'O que você esperava que acontecesse?', hint: 'Descreva o comportamento correto do sistema.', placeholder: 'Ex.: A despesa deveria ser salva e aparecer na listagem...' },
  { key: 'observed', question: 'O que aconteceu de fato?', hint: 'Inclua a mensagem exibida ou outro comportamento observado.', placeholder: 'Ex.: Apareceu uma mensagem de erro e nada foi salvo...' },
  { key: 'frequency', question: 'Com que frequência a falha acontece?', hint: 'Isso ajuda a diferenciar falhas constantes de comportamentos intermitentes.', placeholder: 'Ex.: Acontece sempre que tento cadastrar...' },
]

function classifyIssue(issue, evidence) {
  const combined = `${issue.description} ${issue.observed} ${evidence.join(' ')}`.toLowerCase()
  const signals = []
  if (/500|internal server|servidor/.test(combined)) signals.push({ label: 'Erro de servidor mencionado', detail: 'O relato ou as evidências mencionam HTTP 500/erro de servidor.', status: 'fact' })
  if (/timeout|tempo limite|demora/.test(combined)) signals.push({ label: 'Possível problema de tempo de resposta', detail: 'Há menção a demora ou timeout; vale conferir a duração da requisição.', status: 'hypothesis' })
  if (/login|sessão|sessao|autentica/.test(combined)) signals.push({ label: 'Contexto de autenticação', detail: 'Verifique se a sessão estava válida no momento da falha.', status: 'check' })
  if (evidence.length) signals.push({ label: 'Arquivos anexados pelo usuário', detail: `${evidence.length} arquivo(s) foram selecionados para esta demonstração. O conteúdo não foi enviado para análise automática.`, status: 'fact' })
  if (!signals.length) signals.push({ label: 'Contexto técnico ainda limitado', detail: 'O relato não contém sinais técnicos suficientes para sugerir uma linha específica de investigação.', status: 'check' })
  return signals
}

function App() {
  const [page, setPage] = useState('dashboard')
  const [issue, setIssue] = useState(initialIssue)
  const [evidence, setEvidence] = useState([])
  const [chat, setChat] = useState([])
  const [answer, setAnswer] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [report, setReport] = useState(null)
  const [toast, setToast] = useState('')
  const fileRef = useRef(null)

  const completedFields = useMemo(() => {
    const required = ['description', 'steps', 'expected', 'observed']
    return required.filter(key => issue[key]?.trim()).length
  }, [issue])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const updateIssue = (key, value) => setIssue(prev => ({ ...prev, [key]: value }))

  const startInvestigation = (useDemo = false) => {
    const data = useDemo ? demoIssue : issue
    if (!data.description.trim()) {
      notify('Descreva a falha antes de iniciar a investigação.')
      return
    }
    setIssue(data)
    setQuestionIndex(0)
    setChat([{
      role: 'assistant',
      text: `Entendi o relato: “${data.description}”\n\nVou ajudar a complementar as informações para tornar a falha mais fácil de investigar e reproduzir. Vamos começar pelos passos executados.`
    }])
    setAnswer('')
    setPage('investigation')
  }

  const sendAnswer = () => {
    if (!answer.trim()) return
    const current = questions[questionIndex]
    const updated = { ...issue, [current.key]: answer.trim() }
    setIssue(updated)
    setChat(prev => [...prev, { role: 'user', text: answer.trim() }])
    setAnswer('')
    if (questionIndex < questions.length - 1) {
      const nextIndex = questionIndex + 1
      setQuestionIndex(nextIndex)
      setChat(prev => [...prev, { role: 'assistant', text: questions[nextIndex].question }])
    } else {
      setChat(prev => [...prev, { role: 'assistant', text: 'Ótimo! Já temos mais contexto. Você pode gerar um relatório preliminar e revisar as informações antes de compartilhar com desenvolvimento.' }])
    }
  }

  const generateReport = () => {
    const missing = []
    if (!issue.steps.trim()) missing.push('Passos exatos para reproduzir')
    if (!issue.expected.trim()) missing.push('Resultado esperado')
    if (!issue.observed.trim()) missing.push('Resultado observado')
    if (!issue.frequency.trim()) missing.push('Frequência da ocorrência')
    const signals = classifyIssue(issue, evidence)
    setReport({ missing, signals, createdAt: new Date().toLocaleString('pt-BR') })
    setPage('report')
  }

  const reset = () => {
    setIssue(initialIssue)
    setEvidence([])
    setChat([])
    setReport(null)
    setPage('new')
  }

  const onFiles = (event) => {
    const selected = Array.from(event.target.files || [])
    setEvidence(prev => [...prev, ...selected.map(file => file.name)])
    event.target.value = ''
  }

  const navItems = [
    { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'new', label: 'Nova investigação', icon: Plus },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Search size={21} strokeWidth={2.5} /></div>
          <div><strong>BugLens</strong><span>AI · QA WORKSPACE</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navItems.map(item => {
            const Icon = item.icon
            return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}><Icon size={17}/>{item.label}</button>
          })}
          {page === 'investigation' && <button className="nav-item active"><MessageCircle size={17}/>Investigação atual</button>}
          {page === 'report' && <button className="nav-item active"><FileText size={17}/>Relatório</button>}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Lightbulb size={17}/></div>
            <strong>Investigue melhor</strong>
            <p>Quanto mais contexto e evidências, mais útil será o relatório.</p>
          </div>
          <div className="profile">
            <div className="avatar">QA</div>
            <div><strong>Analista de QA</strong><span>Workspace pessoal</span></div>
            <ChevronDown size={15} className="muted"/>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{page === 'dashboard' ? 'Visão geral' : page === 'new' ? 'Nova investigação' : page === 'investigation' ? 'Investigação' : 'Relatório'}</strong></div>
          <div className="top-actions"><span className="demo-pill"><span/> Modo demonstração</span><button className="icon-button" title="Ajuda"><CircleHelp size={18}/></button></div>
        </header>

        {page === 'dashboard' && <Dashboard onNew={() => setPage('new')} onDemo={() => { setIssue(demoIssue); startInvestigation(true) }} />}
        {page === 'new' && <NewInvestigation issue={issue} updateIssue={updateIssue} evidence={evidence} fileRef={fileRef} onFiles={onFiles} onStart={() => startInvestigation(false)} onDemo={() => startInvestigation(true)} onBack={() => setPage('dashboard')} />}
        {page === 'investigation' && <Investigation issue={issue} chat={chat} answer={answer} setAnswer={setAnswer} questionIndex={questionIndex} onSend={sendAnswer} onReport={generateReport} onBack={() => setPage('new')} />}
        {page === 'report' && <Report issue={issue} report={report} evidence={evidence} onBack={() => setPage('investigation')} onNew={reset} notify={notify} />}
      </main>
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>
}

function Dashboard({ onNew, onDemo }) {
  return <div className="content">
    <PageHeading eyebrow="TERÇA-FEIRA, 24 DE NOVEMBRO" title="Visão geral" subtitle="Transforme relatos incompletos em investigações mais claras." action={<button className="button primary" onClick={onNew}><Plus size={17}/> Nova investigação</button>}/>
    <section className="hero-panel">
      <div className="hero-copy">
        <div className="hero-tag"><Sparkles size={14}/> INTELIGÊNCIA APLICADA AO QA</div>
        <h2>Enxergue além<br/>do erro.</h2>
        <p>Organize relatos, investigue com perguntas inteligentes e reúna evidências para facilitar a reprodução de falhas.</p>
        <div className="hero-actions"><button className="button white" onClick={onNew}>Começar investigação <ArrowRight size={16}/></button><button className="text-button" onClick={onDemo}>Experimentar exemplo <ArrowUpRight size={15}/></button></div>
      </div>
      <div className="hero-visual">
        <div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
        <div className="visual-center"><Search size={34}/></div>
        <div className="float-card float-top"><span className="float-dot purple"/><div><b>Relato analisado</b><small>Informações organizadas</small></div><CheckCircle2 size={17} className="green"/></div>
        <div className="float-card float-bottom"><span className="float-dot orange"/><div><b>Investigação guiada</b><small>3 pontos para esclarecer</small></div><MessageCircle size={17} className="lavender"/></div>
      </div>
    </section>
    <div className="section-title"><div><h3>Seu espaço de trabalho</h3><p>Ferramentas para conduzir uma investigação de ponta a ponta.</p></div><span className="subtle-label">VISÃO DO PRODUTO</span></div>
    <div className="feature-grid">
      <Feature icon={MessageCircle} color="purple" title="Conversa guiada" text="Perguntas progressivas identificam informações que faltam no relato." number="01"/>
      <Feature icon={ScanIcon} color="blue" title="Análise de evidências" text="Organize prints, logs e sinais técnicos sem confundir fatos com hipóteses." number="02"/>
      <Feature icon={ClipboardList} color="orange" title="Relatório estruturado" text="Gere um registro claro para revisão e encaminhamento ao desenvolvimento." number="03"/>
    </div>
    <div className="bottom-note"><ShieldCheck size={18}/><div><strong>QA no controle</strong><span>A ferramenta sugere caminhos de investigação. A validação e a decisão final continuam com a pessoa responsável pelo QA.</span></div></div>
  </div>
}

function ScanIcon(props) { return <Search {...props}/> }

function Feature({ icon: Icon, color, title, text, number }) {
  return <div className="feature-card"><div className={`feature-icon ${color}`}><Icon size={19}/></div><span className="feature-number">{number}</span><h4>{title}</h4><p>{text}</p></div>
}

function Field({ label, required, children, hint }) {
  return <label className="field"><span className="field-label">{label}{required && <i>*</i>}</span>{children}{hint && <small>{hint}</small>}</label>
}

function NewInvestigation({ issue, updateIssue, evidence, fileRef, onFiles, onStart, onDemo, onBack }) {
  return <div className="content narrow">
    <button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Voltar para visão geral</button>
    <PageHeading eyebrow="NOVA OCORRÊNCIA" title="Vamos entender o que aconteceu." subtitle="Comece com as informações que você tem. O BugLens ajuda a identificar o que ainda precisa ser esclarecido."/>
    <div className="form-layout">
      <section className="form-card">
        <div className="card-heading"><div className="step-icon"><Bug size={18}/></div><div><h3>Descreva a falha</h3><p>Não precisa ter todas as respostas agora.</p></div></div>
        <Field label="Título da ocorrência"><input value={issue.title} onChange={e => updateIssue('title', e.target.value)} placeholder="Ex.: Erro ao salvar cadastro de despesa"/></Field>
        <Field label="O que aconteceu?" required hint="Descreva com suas palavras. Você pode começar com uma frase simples.">
          <textarea rows="4" value={issue.description} onChange={e => updateIssue('description', e.target.value)} placeholder="Ex.: Ao tentar cadastrar uma despesa, aparece uma mensagem de erro e não consigo concluir..."/>
        </Field>
        <div className="two-fields">
          <Field label="Módulo ou funcionalidade"><input value={issue.module} onChange={e => updateIssue('module', e.target.value)} placeholder="Ex.: Financeiro"/></Field>
          <Field label="Ambiente"><select value={issue.environment} onChange={e => updateIssue('environment', e.target.value)}><option>Homologação</option><option>Desenvolvimento</option><option>Produção</option><option>Não identificado</option></select></Field>
        </div>
        <Field label="Navegador / dispositivo"><input value={issue.browser} onChange={e => updateIssue('browser', e.target.value)} placeholder="Ex.: Chrome no Windows 11"/></Field>
        <div className="upload-area" onClick={() => fileRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
          <input ref={fileRef} type="file" multiple accept="image/*,.txt,.log,.json,.har" onChange={onFiles} hidden/>
          <div className="upload-icon"><UploadCloud size={20}/></div><div><strong>Adicionar evidências</strong><span>Prints, logs, arquivos JSON ou HAR · seleção local</span></div><button type="button" className="button secondary small"><Paperclip size={14}/> Anexar</button>
        </div>
        {evidence.length > 0 && <div className="file-list">{evidence.map((file, i) => <div key={`${file}-${i}`}><Paperclip size={14}/>{file}<Check size={14}/></div>)}</div>}
        <div className="form-footer"><span><i>*</i> Campo obrigatório</span><div><button className="button secondary" onClick={onDemo}>Carregar exemplo</button><button className="button primary" onClick={onStart}>Iniciar investigação <ArrowRight size={16}/></button></div></div>
      </section>
      <aside className="side-tip"><div className="tip-icon"><WandSparkles size={18}/></div><h4>Não sabe por onde começar?</h4><p>Não tente adivinhar a causa. Conte o que você observou e deixe a investigação ajudar a encontrar as informações que faltam.</p><div className="tip-divider"/><strong>Uma boa investigação reúne:</strong><ul><li><Check size={14}/> Contexto da ocorrência</li><li><Check size={14}/> Passos executados</li><li><Check size={14}/> Resultado esperado e observado</li><li><Check size={14}/> Evidências disponíveis</li></ul></aside>
    </div>
  </div>
}

function Investigation({ issue, chat, answer, setAnswer, questionIndex, onSend, onReport, onBack }) {
  const progress = Math.min(100, Math.round(((questionIndex + (chat.filter(m => m.role === 'user').length)) / questions.length) * 50))
  return <div className="content narrow">
    <button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Voltar ao relato</button>
    <PageHeading eyebrow="INVESTIGAÇÃO EM ANDAMENTO" title="Vamos detalhar essa ocorrência." subtitle="Responda às perguntas para construir um cenário mais claro e reproduzível."/>
    <div className="investigation-layout">
      <section className="chat-card">
        <div className="chat-top"><div className="assistant-avatar"><Sparkles size={18}/></div><div><strong>BugLens Assistant</strong><span><span className="online-dot"/> Assistente de investigação · demonstração</span></div><span className="mode-tag">GUIADO</span></div>
        <div className="chat-context"><span className="context-label">RELATO INICIAL</span><p>{issue.description}</p><div className="context-meta"><span><Bug size={13}/>{issue.module || 'Módulo não informado'}</span><span><Activity size={13}/>{issue.environment}</span></div></div>
        <div className="messages">
          {chat.map((message, index) => <div key={index} className={`message-row ${message.role}`}><div className={`message-avatar ${message.role}`}>{message.role === 'assistant' ? <Sparkles size={14}/> : 'QA'}</div><div className="message-bubble"><span className="message-author">{message.role === 'assistant' ? 'BugLens' : 'Você'}</span>{message.text}</div></div>)}
        </div>
        {questionIndex < questions.length && <div className="question-box"><div className="question-label"><Sparkles size={14}/> PRÓXIMA PERGUNTA</div><strong>{questions[questionIndex].question}</strong><p>{questions[questionIndex].hint}</p><textarea rows="3" value={answer} onChange={e => setAnswer(e.target.value)} placeholder={questions[questionIndex].placeholder} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}/><div className="question-footer"><span>Pressione Enter para enviar</span><button className="button primary" disabled={!answer.trim()} onClick={onSend}>Enviar resposta <Send size={15}/></button></div></div>}
        <div className="chat-bottom"><span><ShieldCheck size={14}/> Revise as informações antes de gerar o relatório.</span><button className="button secondary small" onClick={onReport}>Gerar relatório <ArrowRight size={14}/></button></div>
      </section>
      <aside className="progress-card"><h4>Progresso da investigação</h4><div className="progress-value">{Math.min(100, Math.round((['steps','expected','observed','frequency'].filter(k => issue[k]?.trim()).length / 4) * 100))}% <span>completo</span></div><div className="progress-track"><div style={{ width: `${Math.min(100, Math.round((['steps','expected','observed','frequency'].filter(k => issue[k]?.trim()).length / 4) * 100))}%` }}/></div><div className="check-list">{[{key:'steps',label:'Passos executados'},{key:'expected',label:'Resultado esperado'},{key:'observed',label:'Resultado observado'},{key:'frequency',label:'Frequência'}].map(item => <div key={item.key} className={issue[item.key]?.trim() ? 'done' : ''}>{issue[item.key]?.trim() ? <CheckCircle2 size={16}/> : <span className="empty-check"/>}{item.label}</div>)}</div><div className="progress-tip"><Lightbulb size={16}/><p>Informações ausentes não impedem a investigação, mas devem ficar visíveis no relatório.</p></div></aside>
    </div>
  </div>
}

function Report({ issue, report, evidence, onBack, onNew, notify }) {
  if (!report) return null
  const copyReport = async () => {
    const text = `BUGLENS — RELATÓRIO DE INVESTIGAÇÃO\n\nTítulo: ${issue.title || 'Não informado'}\nDescrição: ${issue.description}\nMódulo: ${issue.module}\nAmbiente: ${issue.environment}\nNavegador: ${issue.browser}\n\nPassos para reprodução:\n${issue.steps || 'Pendente de informação'}\n\nResultado esperado:\n${issue.expected || 'Pendente de informação'}\n\nResultado observado:\n${issue.observed || 'Pendente de informação'}\n\nFrequência: ${issue.frequency || 'Não informada'}\n\nInformações pendentes:\n${report.missing.length ? report.missing.join('\n') : 'Nenhuma identificada'}\n\nObservação: relatório preliminar gerado em modo demonstração. Validar informações antes de encaminhar.`
    try { await navigator.clipboard.writeText(text); notify('Relatório copiado para a área de transferência.') } catch { notify('Não foi possível copiar automaticamente neste navegador.') }
  }
  return <div className="content narrow">
    <button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Voltar à investigação</button>
    <PageHeading eyebrow="RESULTADO DA INVESTIGAÇÃO" title="Relatório preliminar" subtitle="Revise as informações organizadas. Este documento não confirma a causa nem a reprodução do bug." action={<button className="button primary" onClick={copyReport}><ClipboardList size={16}/> Copiar relatório</button>}/>
    <div className="report-banner"><div className="report-banner-icon"><FileText size={20}/></div><div><strong>{issue.title || 'Ocorrência sem título'}</strong><span>Gerado em {report.createdAt} · Revisão humana necessária</span></div><span className="status-review">Pendente de revisão</span></div>
    <div className="report-grid">
      <section className="report-main">
        <ReportSection title="Descrição da ocorrência" icon={Bug}><p>{issue.description}</p></ReportSection>
        <ReportSection title="Contexto" icon={Activity}><div className="detail-grid"><Detail label="Módulo" value={issue.module}/><Detail label="Ambiente" value={issue.environment}/><Detail label="Navegador / dispositivo" value={issue.browser}/><Detail label="Frequência" value={issue.frequency}/></div></ReportSection>
        <ReportSection title="Cenário de reprodução informado" icon={ListChecks}>
          <div className="numbered-step"><span>1</span><p>{issue.steps || 'Passos ainda não informados.'}</p></div>
          <div className="expected-observed"><div><small>RESULTADO ESPERADO</small><p>{issue.expected || 'Pendente de informação.'}</p></div><div><small>RESULTADO OBSERVADO</small><p>{issue.observed || 'Pendente de informação.'}</p></div></div>
        </ReportSection>
        <ReportSection title="Evidências anexadas" icon={Paperclip}>{evidence.length ? evidence.map((f, i) => <div className="evidence-row" key={i}><Paperclip size={15}/>{f}<span>Selecionado localmente</span></div>) : <p className="muted-text">Nenhum arquivo anexado.</p>}</ReportSection>
      </section>
      <aside className="report-side">
        <div className="report-side-card"><div className="side-card-title"><AlertCircle size={17}/><strong>Informações pendentes</strong></div>{report.missing.length ? <><p>Estes pontos ainda precisam ser esclarecidos:</p>{report.missing.map((item, i) => <div className="pending-item" key={i}><span>{i + 1}</span>{item}</div>)}</> : <div className="all-done"><CheckCircle2 size={17}/> Campos principais preenchidos.</div>}</div>
        <div className="report-side-card"><div className="side-card-title"><Sparkles size={17}/><strong>Sinais para investigação</strong></div>{report.signals.map((signal, i) => <div className="signal-item" key={i}><span className={`signal-dot ${signal.status}`}/><div><strong>{signal.label}</strong><p>{signal.detail}</p></div></div>)}</div>
        <div className="human-review"><ShieldCheck size={18}/><div><strong>Validação humana</strong><p>As sugestões são preliminares. Confirme os passos e as evidências antes de registrar ou encaminhar o bug.</p></div></div>
      </aside>
    </div>
    <div className="report-actions"><button className="button secondary" onClick={onBack}><ArrowLeft size={15}/> Continuar investigação</button><button className="button primary" onClick={onNew}><Plus size={16}/> Nova ocorrência</button></div>
    <div className="demo-disclaimer"><AlertCircle size={15}/> Protótipo demonstrativo: nesta versão, perguntas e análise são guiadas por regras locais. Ainda não há integração com um modelo externo de IA nem leitura automática do conteúdo dos anexos.</div>
  </div>
}

function ReportSection({ title, icon: Icon, children }) {
  return <div className="report-section"><h3><Icon size={17}/>{title}</h3>{children}</div>
}
function Detail({ label, value }) { return <div className="detail"><small>{label}</small><strong>{value || 'Não informado'}</strong></div> }

export default App
