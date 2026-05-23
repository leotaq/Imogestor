"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useUsuario } from "@/lib/useUsuario"
import { listarManutencoes } from "@/services/manutencoesService"
import { criarOrcamento } from "@/services/orcamentosService"
import { criarPrestador, listarPrestadores } from "@/services/prestadoresService"
import { Orcamento, Prestador, SolicitacaoManutencao } from "@/types/database.types"

type WritableFileLike = {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

type FileHandleLike = {
  createWritable: () => Promise<WritableFileLike>
}

type DirectoryHandleLike = {
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<DirectoryHandleLike>
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>
}

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandleLike>
}

interface OrcamentoFormProps {
  initialSolicitacaoId?: string
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildDateTag(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildSafeFilename(filename: string, index: number) {
  const sanitized = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .trim()

  if (sanitized) return sanitized
  return `arquivo-${index + 1}`
}

function getFolderByFile(file: File) {
  if (file.type.startsWith("image/")) return "img"
  if (file.type.startsWith("video/")) return "video"
  return "doc-notas-fiscais"
}

function formatSolicitacaoOption(solicitacao: SolicitacaoManutencao) {
  return `${solicitacao.id.slice(0, 8)} - ${solicitacao.tipo_manutencao} - ${solicitacao.nome_solicitante}`
}

function resumoDescricao(texto: string) {
  if (texto.length <= 120) return texto
  return `${texto.slice(0, 120)}...`
}

async function salvarMidiaEmPastaLocal(params: {
  raiz: DirectoryHandleLike
  files: File[]
  tipoManutencao: string
}) {
  const nomePastaPrincipal = `Manutencao-${buildDateTag()}-${slugify(params.tipoManutencao || "geral") || "geral"}`
  const pastaPrincipal = await params.raiz.getDirectoryHandle(nomePastaPrincipal, {
    create: true,
  })

  const pastaImagem = await pastaPrincipal.getDirectoryHandle("img", { create: true })
  const pastaVideo = await pastaPrincipal.getDirectoryHandle("video", { create: true })
  const pastaDoc = await pastaPrincipal.getDirectoryHandle("doc-notas-fiscais", {
    create: true,
  })

  for (let index = 0; index < params.files.length; index += 1) {
    const file = params.files[index]
    const nomeArquivo = buildSafeFilename(file.name, index)
    const folderName = getFolderByFile(file)
    const pastaAlvo =
      folderName === "img" ? pastaImagem : folderName === "video" ? pastaVideo : pastaDoc

    const fileHandle = await pastaAlvo.getFileHandle(nomeArquivo, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(file)
    await writable.close()
  }

  return nomePastaPrincipal
}

export default function OrcamentoForm({ initialSolicitacaoId = "" }: OrcamentoFormProps) {
  const router = useRouter()
  const { imobiliariaId, loading: loadingUser } = useUsuario()

  const [loadingBase, setLoadingBase] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState("")

  const [arquivos, setArquivos] = useState<File[]>([])
  const [pastaRaiz, setPastaRaiz] = useState<DirectoryHandleLike | null>(null)

  const [prestadores, setPrestadores] = useState<Prestador[]>([])
  const [manutencoes, setManutencoes] = useState<SolicitacaoManutencao[]>([])

  const [form, setForm] = useState({
    solicitacaoBusca: initialSolicitacaoId,
    solicitacaoId: "",
    prestadorBusca: "",
    prestadorId: "",
    prestadorTelefone: "",
    prestadorEspecialidade: "",
    valor: "",
    descricao: "",
    status: "pendente",
  })

  useEffect(() => {
    if (!imobiliariaId) return
    const id = imobiliariaId

    async function carregarBase() {
      setLoadingBase(true)
      try {
        const [prestadoresData, manutencoesData] = await Promise.all([
          listarPrestadores(id),
          listarManutencoes(id),
        ])

        setPrestadores(prestadoresData)
        setManutencoes(manutencoesData)
      } catch (error) {
        console.error("Erro ao carregar base de orcamento:", error)
        setErro("Nao foi possivel carregar prestadores e solicitacoes.")
      } finally {
        setLoadingBase(false)
      }
    }

    void carregarBase()
  }, [imobiliariaId])

  useEffect(() => {
    if (!initialSolicitacaoId || manutencoes.length === 0) return

    const preSelecionada = manutencoes.find((item) => item.id === initialSolicitacaoId)
    if (!preSelecionada) return

    setForm((current) => ({
      ...current,
      solicitacaoId: preSelecionada.id,
      solicitacaoBusca: preSelecionada.id,
    }))
  }, [initialSolicitacaoId, manutencoes])

  const prestadorSelecionado = useMemo(
    () => prestadores.find((prestador) => prestador.id === form.prestadorId) ?? null,
    [prestadores, form.prestadorId]
  )

  const solicitacaoSelecionada = useMemo(
    () => manutencoes.find((solicitacao) => solicitacao.id === form.solicitacaoId) ?? null,
    [manutencoes, form.solicitacaoId]
  )

  const solicitacaoIdOptions = useMemo(
    () =>
      manutencoes.map((solicitacao) => ({
        value: solicitacao.id,
        label: `${solicitacao.id.slice(0, 8)} - ${solicitacao.tipo_manutencao}`,
      })),
    [manutencoes]
  )

  function buscarPrestadorExato(texto: string) {
    const normalized = normalizeText(texto)
    if (!normalized) return null

    return (
      prestadores.find((prestador) => prestador.id.toLowerCase() === normalized) ??
      prestadores.find((prestador) => normalizeText(prestador.nome) === normalized) ??
      null
    )
  }

  function buscarPrestadorParcial(texto: string) {
    const normalized = normalizeText(texto)
    if (!normalized) return null

    return (
      prestadores.find((prestador) => normalizeText(prestador.nome).includes(normalized)) ?? null
    )
  }

  function buscarSolicitacaoExata(texto: string) {
    const normalized = normalizeText(texto)
    if (!normalized) return null

    return (
      manutencoes.find((solicitacao) => solicitacao.id.toLowerCase() === normalized) ??
      manutencoes.find((solicitacao) => normalizeText(formatSolicitacaoOption(solicitacao)) === normalized) ??
      null
    )
  }

  function buscarSolicitacaoParcial(texto: string) {
    const normalized = normalizeText(texto)
    if (!normalized) return null

    return (
      manutencoes.find((solicitacao) => solicitacao.id.toLowerCase().includes(normalized)) ??
      manutencoes.find((solicitacao) => normalizeText(solicitacao.tipo_manutencao).includes(normalized)) ??
      manutencoes.find((solicitacao) => normalizeText(solicitacao.nome_solicitante).includes(normalized)) ??
      manutencoes.find((solicitacao) => normalizeText(solicitacao.descricao).includes(normalized)) ??
      null
    )
  }

  async function selecionarPastaRaiz() {
    const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker
    if (!picker) {
      alert("Seu navegador nao permite selecao de pasta para gravar arquivos locais.")
      return
    }

    try {
      const handle = await picker()
      setPastaRaiz(handle)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return

      console.error("Erro ao selecionar pasta:", error)
      alert("Nao foi possivel selecionar a pasta de destino.")
    }
  }

  async function garantirPrestador(): Promise<Prestador> {
    if (form.prestadorId) {
      const prestadorExistente = prestadores.find((prestador) => prestador.id === form.prestadorId)
      if (prestadorExistente) return prestadorExistente
    }

    const prestadorExato = buscarPrestadorExato(form.prestadorBusca)
    if (prestadorExato) return prestadorExato

    const prestadorParcial = buscarPrestadorParcial(form.prestadorBusca)
    if (prestadorParcial) return prestadorParcial

    const nome = form.prestadorBusca.trim()
    if (!nome) {
      throw new Error("Selecione um prestador cadastrado ou digite o nome para criar.")
    }

    if (!imobiliariaId) {
      throw new Error("Imobiliaria nao identificada para criar novo prestador.")
    }

    const novoPrestador = await criarPrestador({
      imobiliaria_id: imobiliariaId,
      nome,
      telefone: form.prestadorTelefone.trim() || null,
      especialidade: form.prestadorEspecialidade.trim() || null,
      faturamento_tipo: null,
      metodo_recebimento: null,
      dia_recebimento: null,
      dados_recebimento: null,
    })

    setPrestadores((current) => [...current, novoPrestador])
    return novoPrestador
  }

  function garantirSolicitacao(): SolicitacaoManutencao {
    if (manutencoes.length === 0) {
      throw new Error("Nao ha solicitacao cadastrada. Crie uma manutencao antes de adicionar orcamento.")
    }

    if (form.solicitacaoId) {
      const solicitacaoAtual = manutencoes.find((item) => item.id === form.solicitacaoId)
      if (solicitacaoAtual) return solicitacaoAtual
    }

    const solicitacaoExata = buscarSolicitacaoExata(form.solicitacaoBusca)
    if (solicitacaoExata) return solicitacaoExata

    const solicitacaoParcial = buscarSolicitacaoParcial(form.solicitacaoBusca)
    if (solicitacaoParcial) return solicitacaoParcial

    throw new Error("Selecione uma solicitacao valida. O orcamento so pode ser criado apos manutencao.")
  }

  async function criarRegistroOrcamento(params: {
    solicitacaoId: string
    prestadorId: string
  }): Promise<Orcamento> {
    if (!imobiliariaId) {
      throw new Error("Imobiliaria nao identificada para criar orcamento.")
    }

    const valor = Number(form.valor)
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new Error("Informe um valor valido para o orcamento.")
    }

    return criarOrcamento({
      imobiliaria_id: imobiliariaId,
      solicitacao_id: params.solicitacaoId,
      prestador_id: params.prestadorId,
      valor,
      descricao: form.descricao.trim() || null,
      status: form.status,
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErro("")
    setSaving(true)

    try {
      const solicitacao = garantirSolicitacao()
      const prestador = await garantirPrestador()

      await criarRegistroOrcamento({
        solicitacaoId: solicitacao.id,
        prestadorId: prestador.id,
      })

      let pastaCriada: string | null = null
      if (arquivos.length > 0 && pastaRaiz) {
        pastaCriada = await salvarMidiaEmPastaLocal({
          raiz: pastaRaiz,
          files: arquivos,
          tipoManutencao: solicitacao.tipo_manutencao,
        })
      }

      const resumoMidia =
        arquivos.length === 0
          ? ""
          : pastaRaiz
            ? ` Arquivos organizados na pasta ${pastaCriada}.`
            : " Arquivos selecionados, mas sem pasta de destino para gravacao local."

      alert(`Orcamento salvo com sucesso para a solicitacao ${solicitacao.id}.${resumoMidia}`)
      router.push("/orcamentos")
    } catch (error) {
      console.error("Erro ao salvar orcamento:", error)
      setErro(error instanceof Error ? error.message : "Nao foi possivel salvar o orcamento.")
    } finally {
      setSaving(false)
    }
  }

  if (loadingUser || loadingBase) {
    return <p className="text-gray-500">Carregando...</p>
  }

  if (!imobiliariaId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Nao foi possivel identificar sua imobiliaria.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Solicitacao de manutencao</h2>
            <p className="text-sm text-gray-500">
              O orcamento so pode ser criado apos uma solicitacao cadastrada em manutencoes.
            </p>
          </div>
          <Link href="/manutencoes/nova" className="text-sm font-medium text-primary-700 hover:underline">
            Nova manutencao
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          <Select
            label="ID da manutencao"
            options={solicitacaoIdOptions}
            value={form.solicitacaoId}
            onChange={(e) => {
              const idSelecionado = e.target.value
              const selecionada = manutencoes.find((item) => item.id === idSelecionado)

              setForm((current) => ({
                ...current,
                solicitacaoId: idSelecionado,
                solicitacaoBusca: selecionada?.id ?? "",
              }))
            }}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Buscar solicitacao por ID, tipo, solicitante ou descricao
          </label>
          <input
            list="solicitacoes-list"
            value={form.solicitacaoBusca}
            onChange={(e) => {
              const value = e.target.value
              const encontrada = buscarSolicitacaoExata(value)

              setForm((current) => ({
                ...current,
                solicitacaoBusca: value,
                solicitacaoId: encontrada?.id ?? "",
              }))
            }}
            onBlur={() => {
              if (!form.solicitacaoId && form.solicitacaoBusca.trim()) {
                const parcial = buscarSolicitacaoParcial(form.solicitacaoBusca)
                if (parcial) {
                  setForm((current) => ({
                    ...current,
                    solicitacaoId: parcial.id,
                    solicitacaoBusca: parcial.id,
                  }))
                }
              }
            }}
            placeholder="Ex.: UUID da solicitacao"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
          <datalist id="solicitacoes-list">
            {manutencoes.map((solicitacao) => (
              <option key={`${solicitacao.id}-id`} value={solicitacao.id}>
                {formatSolicitacaoOption(solicitacao)}
              </option>
            ))}
            {manutencoes.map((solicitacao) => (
              <option key={`${solicitacao.id}-resumo`} value={formatSolicitacaoOption(solicitacao)}>
                {solicitacao.id}
              </option>
            ))}
          </datalist>
          <p className="text-xs text-gray-500">
            {manutencoes.length === 0
              ? "Nenhuma solicitacao encontrada. Crie uma manutencao primeiro."
              : `${manutencoes.length} solicitacao(oes) disponivel(eis) para orcamento.`}
          </p>
        </div>

        {solicitacaoSelecionada && (
          <div className="space-y-2 rounded-lg border border-primary-100 bg-primary-50/70 p-4 text-sm text-gray-700">
            <p>
              <strong>ID:</strong> {solicitacaoSelecionada.id}
            </p>
            <p>
              <strong>Tipo:</strong> {solicitacaoSelecionada.tipo_manutencao}
            </p>
            <p>
              <strong>Solicitante:</strong> {solicitacaoSelecionada.nome_solicitante}
            </p>
            <p>
              <strong>Status:</strong> {solicitacaoSelecionada.status}
            </p>
            <p>
              <strong>Descricao da manutencao:</strong> {resumoDescricao(solicitacaoSelecionada.descricao)}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prestador e valores</h2>
          <p className="text-sm text-gray-500">
            Selecione um prestador existente ou digite para cadastrar automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Prestador</label>
            <input
              list="prestadores-list"
              value={form.prestadorBusca}
              onChange={(e) => {
                const value = e.target.value
                const encontrado = buscarPrestadorExato(value)

                setForm((current) => ({
                  ...current,
                  prestadorBusca: value,
                  prestadorId: encontrado?.id ?? "",
                }))
              }}
              onBlur={() => {
                if (!form.prestadorId && form.prestadorBusca.trim()) {
                  const parcial = buscarPrestadorParcial(form.prestadorBusca)
                  if (parcial) {
                    setForm((current) => ({
                      ...current,
                      prestadorId: parcial.id,
                    }))
                  }
                }
              }}
              placeholder="Digite nome ou ID do prestador"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <datalist id="prestadores-list">
              {prestadores.map((prestador) => (
                <option key={prestador.id} value={prestador.nome}>
                  {prestador.id}
                </option>
              ))}
            </datalist>
            <p className="text-xs text-gray-500">
              {prestadorSelecionado
                ? `Selecionado: ${prestadorSelecionado.nome}`
                : "Se o nome nao existir, um novo prestador sera criado automaticamente."}
            </p>
          </div>

          <Input
            label="Valor do orcamento (R$)"
            type="number"
            step="0.01"
            min="0"
            value={form.valor}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                valor: e.target.value,
              }))
            }
            required
          />

          <Input
            label="Telefone do novo prestador (opcional)"
            value={form.prestadorTelefone}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                prestadorTelefone: e.target.value,
              }))
            }
          />

          <Input
            label="Especialidade do novo prestador (opcional)"
            value={form.prestadorEspecialidade}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                prestadorEspecialidade: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descricao detalhada do orcamento</label>
          <textarea
            value={form.descricao}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                descricao: e.target.value,
              }))
            }
            placeholder="Detalhe os materiais, servicos e observacoes para aprovacao."
            className="min-h-36 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Midias, documentos e notas</h2>
            <p className="text-sm text-gray-500">
              Selecione uma pasta destino para salvar os arquivos organizados automaticamente.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={selecionarPastaRaiz}>
            Selecionar pasta destino
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          {pastaRaiz
            ? "Pasta selecionada. Sera criada estrutura: Manutencao-data-tipo / img / video / doc-notas-fiscais."
            : "Nenhuma pasta selecionada. O cadastro segue normal, mas arquivos nao serao gravados localmente."}
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Arquivos (fotos, videos, documentos, notas fiscais)
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-primary-700"
          />
          <p className="text-xs text-gray-500">
            {arquivos.length > 0
              ? `${arquivos.length} arquivo(s) selecionado(s).`
              : "Nenhum arquivo selecionado."}
          </p>
        </div>
      </section>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={saving} className="min-w-40">
          {saving ? "Salvando..." : "Salvar orcamento"}
        </Button>
      </div>
    </form>
  )
}
