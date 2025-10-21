'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '../../../lib/supabaseServer';
import { assetFormSchema } from '../../../components/assets/asset-schema';

const writeSchema = assetFormSchema.extend({
  purchased_at: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value).toISOString() : null)),
  buyback_available_at: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value).toISOString() : null)),
  is_buyback_allowed: z.coerce.boolean()
});

export type AssetWritePayload = z.infer<typeof writeSchema>;

export async function upsertAssetAction(input: AssetWritePayload) {
  const payload = writeSchema.parse(input);
  const supabase = getServerClient();

  const mutation =
    payload.id != null
      ? supabase
          .from('assets')
          .update({
            asset_code: payload.asset_code,
            asset_type: payload.asset_type,
            brand_model: payload.brand_model,
            purchased_at: payload.purchased_at,
            purchase_price: payload.purchase_price,
            market_price: payload.market_price,
            assigned_to: payload.assigned_to,
            department_id: payload.department_id,
            status: payload.status,
            is_buyback_allowed: payload.is_buyback_allowed,
            buyback_available_at: payload.buyback_available_at,
            notes: payload.notes
          })
          .eq('id', payload.id)
      : supabase.from('assets').insert({
          asset_code: payload.asset_code,
          asset_type: payload.asset_type,
          brand_model: payload.brand_model,
          purchased_at: payload.purchased_at,
          purchase_price: payload.purchase_price,
          market_price: payload.market_price,
          assigned_to: payload.assigned_to,
          department_id: payload.department_id,
          status: payload.status,
          is_buyback_allowed: payload.is_buyback_allowed,
          buyback_available_at: payload.buyback_available_at,
          notes: payload.notes
        });

  const { error } = await mutation;
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/assets');
  return { success: true };
}
