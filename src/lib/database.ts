import { supabase } from './supabase';
import { Box, Location } from './types';
import { getCurrentUser } from './auth';

// Location functions
export const getStoredLocations = async (): Promise<Location[]> => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    return data.map(location => ({
      id: location.id,
      name: location.name,
      description: location.description || undefined,
      user_id: location.user_id,
      createdAt: new Date(location.created_at)
    }));
  } catch (error) {
    console.error('Error loading locations:', error);
    return [];
  }
};

export const saveLocation = async (location: { name: string; description?: string }): Promise<void> => {
  try {
    const { user } = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('locations')
      .insert({
        name: location.name,
        description: location.description || null,
        user_id: user.id,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
};

export const updateLocation = async (locationId: string, updates: { name?: string; description?: string }): Promise<void> => {
  try {
    const { user } = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('locations')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description || null }),
      })
      .eq('id', locationId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const deleteLocation = async (locationId: string): Promise<void> => {
  try {
    const { user } = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

// Box functions
export const getStoredBoxes = async (): Promise<Box[]> => {
  try {
    const { data, error } = await supabase
      .from('boxes')
      .select(`
        *,
        box_contents (content)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching boxes:', error);
      return [];
    }

    return data.map(box => ({
      id: box.id,
      name: box.name,
      description: box.description || undefined,
      qrCode: box.qr_code,
      imageUrl: box.image_url || undefined,
      locationId: box.location_id,
      user_id: box.user_id,
      contents: box.box_contents?.map((bc: { content: string }) => bc.content) || [],
      aiAnalysis: box.ai_analysis || undefined,
      createdAt: new Date(box.created_at),
      updatedAt: new Date(box.updated_at)
    }));
  } catch (error) {
    console.error('Error loading boxes:', error);
    return [];
  }
};

export const saveBox = async (box: Box): Promise<void> => {
  try {
    // First, upsert the box
    const { error: boxError } = await supabase
      .from('boxes')
      .upsert({
        id: box.id,
        name: box.name,
        description: box.description || null,
        qr_code: box.qrCode,
        image_url: box.imageUrl || null,
        location_id: box.locationId,
        user_id: box.user_id,
        ai_analysis: box.aiAnalysis || null,
        created_at: box.createdAt.toISOString(),
        updated_at: box.updatedAt.toISOString()
      });

    if (boxError) {
      console.error('Error saving box:', boxError);
      throw boxError;
    }

    // Delete existing contents
    const { error: deleteError } = await supabase
      .from('box_contents')
      .delete()
      .eq('box_id', box.id);

    if (deleteError) {
      console.error('Error deleting old contents:', deleteError);
      throw deleteError;
    }

    // Insert new contents
    if (box.contents.length > 0) {
      const contentsToInsert = box.contents.map(content => ({
        box_id: box.id,
        content: content
      }));

      const { error: contentsError } = await supabase
        .from('box_contents')
        .insert(contentsToInsert);

      if (contentsError) {
        console.error('Error saving contents:', contentsError);
        throw contentsError;
      }
    }
  } catch (error) {
    console.error('Error saving box:', error);
    throw error;
  }
};

export const deleteBox = async (boxId: string): Promise<void> => {
  try {
    // Contents will be deleted automatically due to cascade
    const { error } = await supabase
      .from('boxes')
      .delete()
      .eq('id', boxId);

    if (error) {
      console.error('Error deleting box:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting box:', error);
    throw error;
  }
};

export const getBoxByQRCode = async (qrCode: string): Promise<Box | null> => {
  try {
    const { data, error } = await supabase
      .from('boxes')
      .select(`
        *,
        box_contents (content)
      `)
      .eq('qr_code', qrCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching box by QR code:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      qrCode: data.qr_code,
      imageUrl: data.image_url || undefined,
      locationId: data.location_id,
      user_id: data.user_id,
      contents: data.box_contents?.map((bc: { content: string }) => bc.content) || [],
      aiAnalysis: data.ai_analysis || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error finding box by QR code:', error);
    return null;
  }
};

// Utility to get box count for a location
export const getBoxCountForLocation = async (locationId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('boxes')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId);

    if (error) {
      console.error('Error counting boxes for location:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error counting boxes for location:', error);
    return 0;
  }
};

// Search boxes by query
export const searchBoxes = async (query: string, locationId?: string): Promise<Box[]> => {
  try {
    let queryBuilder = supabase
      .from('boxes')
      .select(`
        *,
        box_contents (content)
      `);

    // Add location filter if provided
    if (locationId && locationId !== 'all') {
      queryBuilder = queryBuilder.eq('location_id', locationId);
    }

    // Add text search if query provided
    if (query.trim()) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,box_contents.content.ilike.%${query}%`
      );
    }

    const { data, error } = await queryBuilder.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error searching boxes:', error);
      return [];
    }

    return data.map(box => ({
      id: box.id,
      name: box.name,
      description: box.description || undefined,
      qrCode: box.qr_code,
      imageUrl: box.image_url || undefined,
      locationId: box.location_id,
      user_id: box.user_id,
      contents: box.box_contents?.map((bc: { content: string }) => bc.content) || [],
      aiAnalysis: box.ai_analysis || undefined,
      createdAt: new Date(box.created_at),
      updatedAt: new Date(box.updated_at)
    }));
  } catch (error) {
    console.error('Error searching boxes:', error);
    return [];
  }
}; 