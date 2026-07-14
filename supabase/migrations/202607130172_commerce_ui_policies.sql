-- MiZona 30.72 - Políticas complementarias para Marketplace y Business conectados

-- El comprador puede cancelar un pedido pendiente/confirmado y confirmar recepción.
drop policy if exists "mz_orders_buyer_update" on public.mz_orders;
create policy "mz_orders_buyer_update" on public.mz_orders for update
using (buyer_user_id = auth.uid())
with check (buyer_user_id = auth.uid());

-- Permitir que propietarios lean sus propias fichas aunque estén pendientes.
drop policy if exists "mz_businesses_owner_read" on public.mz_businesses;
create policy "mz_businesses_owner_read" on public.mz_businesses for select
using (owner_user_id = auth.uid() or status = 'active');

-- Permitir leer productos inactivos solo a propietarios o administradores del negocio.
drop policy if exists "mz_products_owner_read" on public.mz_products;
create policy "mz_products_owner_read" on public.mz_products for select using (
  active = true
  or exists(select 1 from public.mz_businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  or exists(select 1 from public.mz_business_members m where m.business_id = mz_products.business_id and m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','manager'))
);

-- Realtime para catálogo y pedidos.
alter publication supabase_realtime add table public.mz_businesses;
alter publication supabase_realtime add table public.mz_products;
alter publication supabase_realtime add table public.mz_marketplace_listings;
alter publication supabase_realtime add table public.mz_orders;
