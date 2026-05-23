"use client"

import { useEffect, useMemo, useState } from "react"
import { Imovel, SolicitacaoManutencao } from "@/types/database.types"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useUsuario } from "@/lib/useUsuario"
import { criarImovel, listarImoveis } from "@/services/imoveisService"

interface ManutencaoFormProps {
  onSubmit: (dados: Omit<SolicitacaoManutencao, "id" | "created_at">) => Promise<void>
}

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

const TIPO_MANUTENCAO_SUGESTOES = [
  "Eletrica",
  "Hidraulica",
  "Pintura",
  "Alvenaria",
  "Limpeza",
  "Ar-condicionado",
  "Marcenaria",
  "Vidracaria",
  "Jardinagem",
  "Outros",
]

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function formatImovelOption(imovel: Imovel) {
  const parts = [imovel.codigo, imovel.endereco]
  if (imovel.numero) parts.push(`n ${imovel.numero}`)
  if (imovel.bairro) parts.push(imovel.bairro)
  return parts.filter(Boolean).join(" - ")
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

export default function ManutencaoForm({ onSubmit }: ManutencaoFormProps) {
  const { imobiliariaId, loading: loadingUser } = useUsuario()
  const [loadingBase, setLoadingBase] = useState(true)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [arquivos, setArquivos] = useState<File[]>([])
  const [pastaRaiz, setPastaRaiz] = useState<DirectoryHandleLike | null>(null)

  const [form, setForm] = useState({
    imovelBusca: "",
    imovelId: "",
    usarNovoImovel: false,
    novoImovelCodigo: "",
    novoImovelEndereco: "",
    novoImovelNumero: "",
    novoImovelComplemento: "",
    novoImovelBairro: "",
    novoImovelCidade: "",
    solicitante_tipo: "imobiliaria",
    nome_solicitante: "Equipe da imobiliaria",
    telefone: "",
    tipo_manutencao: "",
    descricao: "",
    prazo: "",
    status: "aberta",
  })

  useEffect(() => {
    if (!imobiliariaId) return
    const id = imobiliariaId

    async function carregarImoveis() {
      setLoadingBase(true)
      try {
        const data = await listarImoveis(id)
        setImoveis(data)
      } catch (error) {
        console.error("Erro ao carregar imoveis:", error)
        setErro("Nao foi possivel carregar os imoveis cadastrados.")
      } finally {
        setLoadingBase(false)
      }
    }

    void carregarImoveis()
  }, [imobiliariaId])

  const imovelSelecionado = useMemo(
    () => imoveis.find((imovel) => imovel.id === form.imovelId) ?? null,
    [imoveis, form.imovelId]
  )

  function buscarImovelExato(texto: string) {
    const normalized = normalizeText(texto)
    if (!normalized) return null

    return (
      imoveis.find((imovel) => imovel.id.toLowerCase() === normalized) ??
      imoveis.find((imovel) => normalizeText(imovel.codigo) === normalized) ??
      imoveis.find((imovel) => normalizeText(imovel.endereco) === normalized) ??
      imoveis.find((imovel) => normalizeText(formatImovelOption(imovel)) === normalized) ??
      null
    )
  }

  function buscarImovelParcial(texto: string) {
    const normalized = normalizeText(texto)
    if (!normalized) return null

    return (
      imoveis.find((imovel) => normalizeText(imovel.endereco).includes(normalized)) ??
      imoveis.find((imovel) => normalizeText(formatImovelOption(imovel)).includes(normalized)) ??
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
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      console.error("Erro ao selecionar pasta:", error)
      alert("Nao foi possivel selecionar a pasta de destino.")
    }
  }

  async function garantirImovel(): Promise<Imovel> {
    if (form.usarNovoImovel) {
      if (!imobiliariaId) {
        throw new Error("Imobiliaria nao identificada para criar novo imovel.")
      }

      const codigo = form.novoImovelCodigo.trim()
      const endereco = form.novoImovelEndereco.trim()

      if (!codigo || !endereco) {
        throw new Error("Para novo imovel, preencha codigo e endereco.")
      }

      const novoImovel = await criarImovel({
        imobiliaria_id: imobiliariaId,
        codigo,
        endereco,
        cidade: form.novoImovelCidade.trim() || null,
        bairro: form.novoImovelBairro.trim() || null,
        numero: form.novoImovelNumero.trim() || null,
        complemento: form.novoImovelComplemento.trim() || null,
        proprietario: null,
        proprietario_telefone: null,
        proprietario_email: null,
      })

      setImoveis((current) => [...current, novoImovel])
      return novoImovel
    }

    if (form.imovelId) {
      const imovelExistente = imoveis.find((imovel) => imovel.id === form.imovelId)
      if (imovelExistente) return imovelExistente
    }

    const imovelExato = buscarImovelExato(form.imovelBusca)
    if (imovelExato) return imovelExato

    const imovelParcial = buscarImovelParcial(form.imovelBusca)
    if (imovelParcial) return imovelParcial

    throw new Error("Selecione um imovel existente ou habilite o cadastro de novo imovel.")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!imobiliariaId) {
      setErro("Nao foi possivel identificar sua imobiliaria.")
      return
    }

    setErro("")
    setLoading(true)

    try {
      const imovel = await garantirImovel()
      const tipoManutencao = form.tipo_manutencao.trim()
      const descricao = form.descricao.trim()

      if (!tipoManutencao) {
        throw new Error("Preencha o tipo de manutencao.")
      }

      if (!descricao) {
        throw new Error("Preencha a descricao da solicitacao.")
      }

      if (arquivos.length > 0 && !pastaRaiz) {
        throw new Error("Selecione a pasta de destino para salvar as midias anexadas.")
      }

      if (arquivos.length > 0 && pastaRaiz) {
        await salvarMidiaEmPastaLocal({
          raiz: pastaRaiz,
          files: arquivos,
          tipoManutencao,
        })
      }

      await onSubmit({
        imobiliaria_id: imobiliariaId,
        imovel_id: imovel.id,
        solicitante_tipo: form.solicitante_tipo,
        nome_solicitante: form.nome_solicitante.trim(),
        telefone: form.telefone.trim() || null,
        tipo_manutencao: tipoManutencao,
        descricao,
        prazo: form.prazo || null,
        status: "aberta",
      })
    } catch (error) {
      console.error("Erro ao salvar manutencao:", error)
      setErro(error instanceof Error ? error.message : "Nao foi possivel salvar a solicitacao.")
      setLoading(false)
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
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Imovel da solicitacao</h2>
          <p className="text-sm text-gray-500">
            Selecione um imovel existente por ID, codigo ou endereco. Se ainda nao existir,
            cadastre um novo imovel aqui mesmo.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-800">Selecionar imovel</p>
            <label className="inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={form.usarNovoImovel}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    usarNovoImovel: e.target.checked,
                    imovelBusca: e.target.checked ? "" : current.imovelBusca,
                    imovelId: e.target.checked ? "" : current.imovelId,
                  }))
                }
              />
              Cadastrar novo imovel agora
            </label>
          </div>

          {!form.usarNovoImovel ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Buscar por ID, codigo ou endereco
              </label>
              <input
                list="imoveis-list"
                value={form.imovelBusca}
                onChange={(e) => {
                  const value = e.target.value
                  const encontrado = buscarImovelExato(value)

                  setForm((current) => ({
                    ...current,
                    imovelBusca: value,
                    imovelId: encontrado?.id ?? "",
                  }))
                }}
                onBlur={() => {
                  if (!form.imovelId && form.imovelBusca.trim()) {
                    const parcial = buscarImovelParcial(form.imovelBusca)
                    if (parcial) {
                      setForm((current) => ({
                        ...current,
                        imovelId: parcial.id,
                        imovelBusca: formatImovelOption(parcial),
                      }))
                    }
                  }
                }}
                placeholder="Ex.: UUID, 2644 ou Rua X"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <datalist id="imoveis-list">
                {imoveis.map((imovel) => (
                  <option key={`${imovel.id}-codigo`} value={imovel.codigo}>
                    {formatImovelOption(imovel)}
                  </option>
                ))}
                {imoveis.map((imovel) => (
                  <option key={`${imovel.id}-endereco`} value={imovel.endereco}>
                    {imovel.id}
                  </option>
                ))}
                {imoveis.map((imovel) => (
                  <option key={`${imovel.id}-id`} value={imovel.id}>
                    {formatImovelOption(imovel)}
                  </option>
                ))}
              </datalist>

              {imovelSelecionado && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  ID: {imovelSelecionado.id} | Endereco: {formatImovelOption(imovelSelecionado)}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Codigo do novo imovel"
                value={form.novoImovelCodigo}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    novoImovelCodigo: e.target.value,
                  }))
                }
                required={form.usarNovoImovel}
              />
              <Input
                label="Endereco do novo imovel"
                value={form.novoImovelEndereco}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    novoImovelEndereco: e.target.value,
                  }))
                }
                required={form.usarNovoImovel}
              />
              <Input
                label="Numero"
                value={form.novoImovelNumero}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    novoImovelNumero: e.target.value,
                  }))
                }
              />
              <Input
                label="Complemento"
                value={form.novoImovelComplemento}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    novoImovelComplemento: e.target.value,
                  }))
                }
              />
              <Input
                label="Bairro"
                value={form.novoImovelBairro}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    novoImovelBairro: e.target.value,
                  }))
                }
              />
              <Input
                label="Cidade"
                value={form.novoImovelCidade}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    novoImovelCidade: e.target.value,
                  }))
                }
              />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dados da solicitacao</h2>
          <p className="text-sm text-gray-500">
            Estas informacoes ficam vinculadas a manutencao e sao usadas depois no fluxo de
            orcamentos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Tipo de solicitante"
            options={[
              { value: "proprietario", label: "Proprietario" },
              { value: "inquilino", label: "Inquilino" },
              { value: "imobiliaria", label: "Imobiliaria" },
            ]}
            value={form.solicitante_tipo}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                solicitante_tipo: e.target.value,
              }))
            }
            required
          />

          <Input
            label="Nome do solicitante"
            value={form.nome_solicitante}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                nome_solicitante: e.target.value,
              }))
            }
            required
          />

          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                telefone: e.target.value,
              }))
            }
          />

          <Input
            label="Prazo (opcional)"
            type="date"
            value={form.prazo}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                prazo: e.target.value,
              }))
            }
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Tipo de manutencao (selecione ou digite)
            </label>
            <input
              list="tipos-manutencao-list"
              value={form.tipo_manutencao}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  tipo_manutencao: e.target.value,
                }))
              }
              placeholder="Ex.: Hidraulica"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <datalist id="tipos-manutencao-list">
              {TIPO_MANUTENCAO_SUGESTOES.map((tipo) => (
                <option key={tipo} value={tipo} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descricao detalhada</label>
          <textarea
            value={form.descricao}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                descricao: e.target.value,
              }))
            }
            placeholder="Descreva com detalhes o problema e a necessidade de manutencao."
            className="min-h-32 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Midias, documentos e notas</h2>
            <p className="text-sm text-gray-500">
              Selecione uma pasta para salvar os arquivos no formato organizado automaticamente.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={selecionarPastaRaiz}>
            Selecionar pasta destino
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          {pastaRaiz
            ? "Pasta selecionada. Estrutura criada: Manutencao-data-tipo / img / video / doc-notas-fiscais."
            : "Sem pasta selecionada. Se anexar arquivos, escolha a pasta antes de salvar."}
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
        <Button type="submit" disabled={loading} className="min-w-44">
          {loading ? "Salvando..." : "Salvar solicitacao"}
        </Button>
      </div>
    </form>
  )
}
