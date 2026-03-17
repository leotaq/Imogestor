"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useUsuario } from "@/lib/useUsuario"
import { criarInspection } from "@/services/inspectionsService"
import {
  criarPerson,
  garantirPessoaOperacional,
  listarInspectors,
  personRoleFromUsuarioTipo,
} from "@/services/peopleService"
import {
  buscarPropertyPorCodigo,
  upsertProperty,
} from "@/services/propertiesService"
import { InspectionType, Person } from "@/types/database.types"
import { composePropertyAddress } from "@/lib/property"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"

const TIPO_OPTIONS: { value: InspectionType; label: string }[] = [
  { value: "ocupacao", label: "Ocupacao" },
  { value: "desocupacao", label: "Desocupacao" },
  { value: "revistoria", label: "Revistoria" },
  { value: "visita", label: "Visita" },
  { value: "placa_fotos", label: "Placa/Fotos" },
]

export default function NovaVistoriaPage() {
  const router = useRouter()
  const { imobiliariaId, usuario, loading: loadingUser } = useUsuario()
  const [loading, setLoading] = useState(false)
  const [loadingContext, setLoadingContext] = useState(true)
  const [propertyLookupLoading, setPropertyLookupLoading] = useState(false)
  const [savingInspector, setSavingInspector] = useState(false)
  const [creatorPersonId, setCreatorPersonId] = useState("")
  const [inspectors, setInspectors] = useState<Person[]>([])
  const [propertyFeedback, setPropertyFeedback] = useState("")
  const [quickInspector, setQuickInspector] = useState({
    name: "",
    phone: "",
  })
  const [form, setForm] = useState({
    type: "" as InspectionType | "",
    assigned_to: "",
    property_code: "",
    property_street: "",
    property_number: "",
    property_complement: "",
    property_neighborhood: "",
    property_city: "",
    contract_date: "",
    notes: "",
  })

  useEffect(() => {
    if (!imobiliariaId || !usuario) return

    async function carregarContexto() {
      const currentImobiliariaId = imobiliariaId
      const currentUsuario = usuario
      if (!currentImobiliariaId || !currentUsuario) return

      setLoadingContext(true)
      try {
        const [inspectorsData, creatorPerson] = await Promise.all([
          listarInspectors(currentImobiliariaId),
          garantirPessoaOperacional({
            imobiliaria_id: currentImobiliariaId,
            name: currentUsuario.nome,
            role: personRoleFromUsuarioTipo(currentUsuario.tipo),
          }),
        ])

        setInspectors(inspectorsData)
        setCreatorPersonId(creatorPerson.id)
      } catch (err) {
        console.error("Erro ao preparar contexto da vistoria:", err)
        alert("Nao foi possivel preparar o fluxo de vistoria.")
      } finally {
        setLoadingContext(false)
      }
    }

    void carregarContexto()
  }, [imobiliariaId, usuario])

  const enderecoPreview = useMemo(
    () =>
      composePropertyAddress({
        street: form.property_street,
        number: form.property_number,
        complement: form.property_complement,
        neighborhood: form.property_neighborhood,
        city: form.property_city,
      }),
    [
      form.property_city,
      form.property_complement,
      form.property_neighborhood,
      form.property_number,
      form.property_street,
    ]
  )

  async function handleLookupPropertyCode() {
    if (!imobiliariaId || !form.property_code.trim()) {
      setPropertyFeedback("")
      return
    }

    setPropertyLookupLoading(true)
    setPropertyFeedback("")
    try {
      const property = await buscarPropertyPorCodigo(
        imobiliariaId,
        form.property_code
      )

      if (!property) {
        setPropertyFeedback(
          "Codigo novo. Os dados abaixo serao usados para criar a base do imovel da vistoria."
        )
        return
      }

      setForm((prev) => ({
        ...prev,
        property_code: property.code,
        property_street: property.property_street ?? "",
        property_number: property.property_number ?? "",
        property_complement: property.property_complement ?? "",
        property_neighborhood: property.property_neighborhood ?? "",
        property_city: property.property_city ?? "",
      }))
      setPropertyFeedback(
        "Imovel encontrado. Endereco preenchido automaticamente a partir do codigo."
      )
    } catch (err) {
      console.error("Erro ao buscar imovel por codigo:", err)
      setPropertyFeedback("Nao foi possivel consultar o codigo do imovel agora.")
    } finally {
      setPropertyLookupLoading(false)
    }
  }

  async function handleCreateInspector() {
    if (!imobiliariaId || !quickInspector.name.trim()) return

    setSavingInspector(true)
    try {
      const inspector = await criarPerson({
        imobiliaria_id: imobiliariaId,
        name: quickInspector.name.trim(),
        phone: quickInspector.phone.trim() || null,
        role: "inspector",
        active: true,
      })

      setInspectors((prev) =>
        [...prev, inspector].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      )
      setForm((prev) => ({ ...prev, assigned_to: inspector.id }))
      setQuickInspector({ name: "", phone: "" })
    } catch (err) {
      console.error("Erro ao cadastrar vistoriador:", err)
      alert("Nao foi possivel cadastrar o vistoriador agora.")
    } finally {
      setSavingInspector(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type || !form.assigned_to || !imobiliariaId || !creatorPersonId) {
      alert("Preencha os campos obrigatorios da vistoria.")
      return
    }

    setLoading(true)
    try {
      const propertyAddress = composePropertyAddress({
        street: form.property_street,
        number: form.property_number,
        complement: form.property_complement,
        neighborhood: form.property_neighborhood,
        city: form.property_city,
      })

      const property = await upsertProperty({
        imobiliaria_id: imobiliariaId,
        code: form.property_code,
        address: propertyAddress,
        property_street: form.property_street || null,
        property_number: form.property_number || null,
        property_complement: form.property_complement || null,
        property_neighborhood: form.property_neighborhood || null,
        property_city: form.property_city || null,
      })

      await criarInspection(
        {
          imobiliaria_id: imobiliariaId,
          type: form.type as InspectionType,
          created_by: creatorPersonId,
          assigned_to: form.assigned_to,
          property_code: property.code,
          property_address: property.address,
          property_street: property.property_street,
          property_number: property.property_number,
          property_complement: property.property_complement,
          property_neighborhood: property.property_neighborhood,
          property_city: property.property_city,
          contract_date: form.contract_date || null,
          notes: form.notes || null,
          scheduled_start: null,
          duration_minutes: null,
          scheduled_end: null,
        },
        creatorPersonId
      )

      router.push("/vistorias")
    } catch (err) {
      console.error("Erro ao criar vistoria:", err)
      alert("Erro ao criar vistoria. Verifique os dados e tente novamente.")
      setLoading(false)
    }
  }

  if (loadingUser || loadingContext) {
    return <p className="text-gray-500">Carregando...</p>
  }

  if (!imobiliariaId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Nao foi possivel identificar sua imobiliaria.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Nova vistoria
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Abra a vistoria, escolha o responsavel e aproveite os dados do imovel pelo codigo quando ele ja existir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
              Abertura
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              Dados da vistoria
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Defina o tipo, o vistoriador responsavel e o codigo do imovel.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
            <Select
              label="Tipo de vistoria"
              options={TIPO_OPTIONS}
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as InspectionType })
              }
              required
            />

            <Select
              label="Vistoriador responsavel"
              options={inspectors.map((person) => ({
                value: person.id,
                label: person.name,
              }))}
              value={form.assigned_to}
              onChange={(e) =>
                setForm({ ...form, assigned_to: e.target.value })
              }
              required
            />

            <div className="md:col-span-2">
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                <p className="text-sm font-medium text-gray-900">
                  Nao encontrou o vistoriador?
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Cadastre um vistoriador rapido sem sair desta tela.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto]">
                  <Input
                    label="Nome do vistoriador"
                    value={quickInspector.name}
                    onChange={(e) =>
                      setQuickInspector((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex.: Carlos Lima"
                  />
                  <Input
                    label="Telefone"
                    value={quickInspector.phone}
                    onChange={(e) =>
                      setQuickInspector((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="(51) 99999-9999"
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={savingInspector}
                      className="w-full md:w-auto"
                      onClick={handleCreateInspector}
                    >
                      {savingInspector ? "Salvando..." : "Cadastrar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-col gap-1">
                <Input
                  label="Codigo do imovel"
                  value={form.property_code}
                  onChange={(e) =>
                    setForm({ ...form, property_code: e.target.value })
                  }
                  onBlur={handleLookupPropertyCode}
                  placeholder="Ex.: IMB-102"
                  required
                />
                <p className="text-xs text-gray-500">
                  {propertyLookupLoading
                    ? "Consultando codigo do imovel..."
                    : propertyFeedback || "Ao sair do campo, o sistema tenta recuperar o endereco pelo codigo."}
                </p>
              </div>
            </div>

            <Input
              label="Data do contrato"
              type="date"
              value={form.contract_date}
              onChange={(e) =>
                setForm({ ...form, contract_date: e.target.value })
              }
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
              Imovel
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              Endereco da vistoria
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Quando o codigo ja existir, os dados sao preenchidos automaticamente e podem ser ajustados.
            </p>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <div className="md:col-span-3">
                <Input
                  label="Rua"
                  value={form.property_street}
                  onChange={(e) =>
                    setForm({ ...form, property_street: e.target.value })
                  }
                  required
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Numero"
                  value={form.property_number}
                  onChange={(e) =>
                    setForm({ ...form, property_number: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Complemento"
                  value={form.property_complement}
                  onChange={(e) =>
                    setForm({ ...form, property_complement: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Bairro"
                  value={form.property_neighborhood}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      property_neighborhood: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Cidade"
                  value={form.property_city}
                  onChange={(e) =>
                    setForm({ ...form, property_city: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-6">
                <Input
                  label="Observacoes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Informacoes importantes para a execucao da vistoria"
                />
              </div>
            </div>

            <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                Previa do endereco
              </p>
              <p className="mt-2 text-sm text-gray-700">
                {enderecoPreview || "O endereco consolidado aparecera aqui quando a rua for preenchida."}
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading || !creatorPersonId}>
            {loading ? "Salvando..." : "Criar vistoria"}
          </Button>
        </div>
      </form>
    </div>
  )
}
