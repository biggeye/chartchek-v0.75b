// lib/services/complianceFrameworkService.ts
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { createClient } from '@supabase/supabase-js';

export interface ComplianceFramework {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCompliancePreference {
  user_id: string;
  framework_id: number;
  is_active: boolean;
  compliance_framework?: ComplianceFramework;
}

// Get client for browser context (client-side)
const getClientSideClient = () => {
  return createSupabaseClient();
};

// Get client for server context (using service role key)
const getServerSideClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * Get all active compliance frameworks for a user
 */
export async function getUserComplianceFrameworks(userId: string): Promise<UserCompliancePreference[]> {
  try {
    const supabase = getClientSideClient();
    
    // First get the active framework IDs for the user
    const { data: prefData, error: prefError } = await supabase
      .from('user_compliance_preferences')
      .select('user_id, framework_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);
      
    if (prefError || !prefData || prefData.length === 0) {
      return [];
    }
    
    // Get the framework details
    const frameworkIds = prefData.map(pref => pref.framework_id);
    const { data: frameworkData, error: frameworkError } = await supabase
      .from('compliance_frameworks')
      .select('id, name, description, created_at, updated_at')
      .in('id', frameworkIds);
      
    if (frameworkError) {
      console.error('Error fetching framework details:', frameworkError);
      return [];
    }
    
    // Create a map of framework data
    const frameworkMap = (frameworkData || []).reduce((map, framework) => {
      map[framework.id] = framework;
      return map;
    }, {} as Record<number, ComplianceFramework>);
    
    // Combine the data
    const result = prefData.map(pref => ({
      user_id: pref.user_id,
      framework_id: pref.framework_id,
      is_active: pref.is_active,
      compliance_framework: frameworkMap[pref.framework_id]
    })) as UserCompliancePreference[];
    
    return result;
  } catch (error) {
    console.error('Error in getUserComplianceFrameworks:', error);
    return [];
  }
}

/**
 * Get all compliance frameworks (both active and inactive) for a user
 */
export async function getAllUserComplianceFrameworks(userId: string): Promise<UserCompliancePreference[]> {
  try {
    const supabase = getClientSideClient();
    
    // First get all framework preferences for the user
    const { data: prefData, error: prefError } = await supabase
      .from('user_compliance_preferences')
      .select('user_id, framework_id, is_active')
      .eq('user_id', userId);
      
    if (prefError || !prefData || prefData.length === 0) {
      return [];
    }
    
    // Get the framework details
    const frameworkIds = prefData.map(pref => pref.framework_id);
    const { data: frameworkData, error: frameworkError } = await supabase
      .from('compliance_frameworks')
      .select('id, name, description, created_at, updated_at')
      .in('id', frameworkIds);
      
    if (frameworkError) {
      console.error('Error fetching framework details:', frameworkError);
      return [];
    }
    
    // Create a map of framework data
    const frameworkMap = (frameworkData || []).reduce((map, framework) => {
      map[framework.id] = framework;
      return map;
    }, {} as Record<number, ComplianceFramework>);
    
    // Combine the data
    const result = prefData.map(pref => ({
      user_id: pref.user_id,
      framework_id: pref.framework_id,
      is_active: pref.is_active,
      compliance_framework: frameworkMap[pref.framework_id]
    })) as UserCompliancePreference[];
    
    return result;
  } catch (error) {
    console.error('Error in getAllUserComplianceFrameworks:', error);
    return [];
  }
}

/**
 * Update user's compliance framework preferences
 */
export async function updateUserCompliancePreferences(
  userId: string, 
  frameworkIds: number[], 
  active: boolean = true
): Promise<{ added: number; updated: number }> {
  try {
    const supabase = getClientSideClient();
    
    // First get current preferences
    const { data: currentPrefs } = await supabase
      .from('user_compliance_preferences')
      .select('framework_id')
      .eq('user_id', userId);
      
    const currentFrameworkIds = (currentPrefs || []).map(p => p.framework_id);
    
    // Determine which to add and which to update
    const toAdd = frameworkIds.filter(id => !currentFrameworkIds.includes(id));
    const toUpdate = frameworkIds.filter(id => currentFrameworkIds.includes(id));
    
    // Add new preferences
    if (toAdd.length > 0) {
      const newPrefs = toAdd.map(frameworkId => ({
        user_id: userId,
        framework_id: frameworkId,
        is_active: active
      }));
      
      const { error: insertError } = await supabase
        .from('user_compliance_preferences')
        .insert(newPrefs);
        
      if (insertError) {
        console.error('Error adding compliance preferences:', insertError);
      }
    }
    
    // Update existing preferences
    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('user_compliance_preferences')
        .update({ is_active: active, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('framework_id', toUpdate);
        
      if (updateError) {
        console.error('Error updating compliance preferences:', updateError);
      }
    }
    
    return { added: toAdd.length, updated: toUpdate.length };
  } catch (error) {
    console.error('Error in updateUserCompliancePreferences:', error);
    return { added: 0, updated: 0 };
  }
}

/**
 * Create a new compliance framework
 */
export async function createComplianceFramework(
  name: string, 
  description: string
): Promise<ComplianceFramework | null> {
  try {
    const supabase = getServerSideClient();
    
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .insert({
        name,
        description
      })
      .select('id, name, description, created_at, updated_at')
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to create compliance framework:', error);
    return null;
  }
}

/**
 * Get all available compliance frameworks
 */
export async function getAllComplianceFrameworks(): Promise<ComplianceFramework[]> {
  try {
    const supabase = getClientSideClient();
    
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('id, name, description, created_at, updated_at')
      .order('name');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get compliance frameworks:', error);
    return [];
  }
}

/**
 * Delete a compliance framework (admin only)
 */
export async function deleteComplianceFramework(frameworkId: number): Promise<boolean> {
  try {
    const supabase = getServerSideClient();
    
    // First check if the framework has any documents
    const { count, error: countError } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('framework_id', frameworkId);
      
    if (countError) {
      throw countError;
    }
    
    if (count && count > 0) {
      throw new Error(`Cannot delete framework with ${count} associated documents`);
    }
    
    // Delete the framework
    const { error } = await supabase
      .from('compliance_frameworks')
      .delete()
      .eq('id', frameworkId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete compliance framework:', error);
    return false;
  }
}