alter table prestadores
  add column if not exists faturamento_tipo text null,
  add column if not exists metodo_recebimento text null,
  add column if not exists dia_recebimento text null;

do $$ begin
  alter table prestadores
    add constraint prestadores_faturamento_tipo_check
    check (faturamento_tipo is null or faturamento_tipo in ('nota_fiscal', 'recibo'));
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table prestadores
    add constraint prestadores_metodo_recebimento_check
    check (metodo_recebimento is null or metodo_recebimento in ('pix', 'dinheiro', 'deposito'));
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table prestadores
    add constraint prestadores_dia_recebimento_check
    check (dia_recebimento is null or dia_recebimento in ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'));
exception
  when duplicate_object then null;
end $$;
