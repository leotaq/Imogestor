// Este módulo redireciona para inspectionsService.ts
// A tabela "vistorias" antiga foi substituída por "inspections" (schema do Vistorias_imob)
export {
  listarInspections as listarVistorias,
  buscarInspection as buscarVistoria,
  criarInspection as criarVistoria,
  transitarStatus,
  receberInspection,
  iniciarInspection,
  completarInspection,
  finalizarInspection,
  cancelarInspection,
} from "./inspectionsService"
