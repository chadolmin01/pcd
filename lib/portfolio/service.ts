import { createServerClient } from '@/lib/supabase/supabase';
import type {
  IdeaCore,
  IdeaVersion,
  IdeaSubmission,
  IdeaWithLatestVersion,
  IdeaDetailWithVersions,
  ProgramEligibility,
  IdeaCoreCreateInput,
  IdeaCoreUpdateInput,
  IdeaVersionCreateInput,
  IdeaVersionUpdateInput,
  IdeaSubmissionCreateInput,
  IdeaSubmissionUpdateInput,
  ForkVersionInput,
} from './types';

// ============================================
// Idea Core CRUD
// ============================================

export async function getIdeaCores(userId: string): Promise<IdeaWithLatestVersion[]> {
  const supabase = createServerClient();

  // Get cores with latest version using a subquery
  const { data: cores, error } = await supabase
    .from('idea_cores')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch idea cores: ${error.message}`);
  if (!cores) return [];

  // Get latest version for each core
  const results: IdeaWithLatestVersion[] = await Promise.all(
    cores.map(async (core) => {
      const { data: versions, error: versionError } = await supabase
        .from('idea_versions')
        .select('*')
        .eq('core_id', core.id)
        .is('deleted_at', null)
        .order('version_number', { ascending: false })
        .limit(1);

      if (versionError) {
        console.error(`Failed to fetch versions for core ${core.id}:`, versionError);
      }

      const { count, error: countError } = await supabase
        .from('idea_versions')
        .select('*', { count: 'exact', head: true })
        .eq('core_id', core.id)
        .is('deleted_at', null);

      if (countError) {
        console.error(`Failed to count versions for core ${core.id}:`, countError);
      }

      return {
        ...core,
        latest_version: versions?.[0] || null,
        version_count: count || 0,
      };
    })
  );

  return results;
}

export async function getIdeaCore(coreId: string, userId: string): Promise<IdeaDetailWithVersions | null> {
  const supabase = createServerClient();

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(coreId)) {
    throw new Error('Invalid idea ID format');
  }

  const { data: core, error } = await supabase
    .from('idea_cores')
    .select('*')
    .eq('id', coreId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch idea core: ${error.message}`);
  }

  // Get all versions
  const { data: versions, error: versionsError } = await supabase
    .from('idea_versions')
    .select('*')
    .eq('core_id', coreId)
    .is('deleted_at', null)
    .order('version_number', { ascending: false });

  if (versionsError) throw new Error(`Failed to fetch versions: ${versionsError.message}`);

  // Get all submissions for all versions
  const versionIds = versions?.map((v) => v.id) || [];
  let submissions: IdeaSubmission[] = [];

  if (versionIds.length > 0) {
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('idea_submissions')
      .select('*')
      .in('version_id', versionIds)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Failed to fetch submissions:', submissionsError);
    } else {
      submissions = submissionsData || [];
    }
  }

  return {
    ...core,
    versions: versions || [],
    submissions,
  };
}

export async function createIdeaCore(
  userId: string,
  input: IdeaCoreCreateInput
): Promise<IdeaCore> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('idea_cores')
    .insert({
      user_id: userId,
      title: input.title,
      category: input.category,
      one_liner: input.one_liner || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create idea core: ${error.message}`);
  return data;
}

export async function updateIdeaCore(
  coreId: string,
  userId: string,
  input: IdeaCoreUpdateInput
): Promise<IdeaCore> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('idea_cores')
    .update(input)
    .eq('id', coreId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Failed to update idea core: ${error.message}`);
  return data;
}

export async function deleteIdeaCore(coreId: string, userId: string): Promise<void> {
  const supabase = createServerClient();

  // Soft delete
  const { error } = await supabase
    .from('idea_cores')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', coreId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete idea core: ${error.message}`);
}

// ============================================
// Idea Version CRUD
// ============================================

export async function getIdeaVersions(coreId: string, userId: string): Promise<IdeaVersion[]> {
  const supabase = createServerClient();

  // Verify ownership first
  const { data: core } = await supabase
    .from('idea_cores')
    .select('id')
    .eq('id', coreId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (!core) throw new Error('Idea not found or access denied');

  const { data: versions, error } = await supabase
    .from('idea_versions')
    .select('*')
    .eq('core_id', coreId)
    .is('deleted_at', null)
    .order('version_number', { ascending: false });

  if (error) throw new Error(`Failed to fetch versions: ${error.message}`);
  return versions || [];
}

export async function getIdeaVersion(
  versionId: string,
  userId: string
): Promise<IdeaVersion | null> {
  const supabase = createServerClient();

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(versionId)) {
    throw new Error('Invalid version ID format');
  }

  const { data: version, error } = await supabase
    .from('idea_versions')
    .select('*, idea_cores!inner(user_id)')
    .eq('id', versionId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch version: ${error.message}`);
  }

  // Check ownership via join
  if ((version as { idea_cores: { user_id: string } }).idea_cores.user_id !== userId) {
    return null;
  }

  // Remove the joined data before returning
  const { idea_cores: _, ...versionData } = version as IdeaVersion & { idea_cores: { user_id: string } };
  return versionData;
}

export async function createIdeaVersion(
  userId: string,
  input: IdeaVersionCreateInput
): Promise<IdeaVersion> {
  const supabase = createServerClient();

  // Verify ownership of core
  const { data: core } = await supabase
    .from('idea_cores')
    .select('id')
    .eq('id', input.core_id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (!core) throw new Error('Idea not found or access denied');

  // Get next version number using database function
  const { data: nextNumData, error: nextNumError } = await supabase.rpc(
    'get_next_version_number',
    { p_core_id: input.core_id }
  );

  if (nextNumError) throw new Error(`Failed to get next version number: ${nextNumError.message}`);

  const { data, error } = await supabase
    .from('idea_versions')
    .insert({
      core_id: input.core_id,
      version_number: nextNumData,
      version_name: input.version_name,
      target_program_id: input.target_program_id,
      target_program_name: input.target_program_name,
      validation_level: input.validation_level,
      scorecard: input.scorecard,
      total_score: input.total_score,
      chat_summary: input.chat_summary,
      key_feedback: input.key_feedback || [],
      status: input.status || 'draft',
      forked_from: input.forked_from,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create version: ${error.message}`);
  return data;
}

export async function updateIdeaVersion(
  versionId: string,
  userId: string,
  input: IdeaVersionUpdateInput
): Promise<IdeaVersion> {
  const supabase = createServerClient();

  // Verify ownership via core
  const existing = await getIdeaVersion(versionId, userId);
  if (!existing) throw new Error('Version not found or access denied');

  const { data, error } = await supabase
    .from('idea_versions')
    .update(input)
    .eq('id', versionId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Failed to update version: ${error.message}`);
  return data;
}

export async function deleteIdeaVersion(versionId: string, userId: string): Promise<void> {
  const supabase = createServerClient();

  // Verify ownership
  const existing = await getIdeaVersion(versionId, userId);
  if (!existing) throw new Error('Version not found or access denied');

  // Soft delete
  const { error } = await supabase
    .from('idea_versions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', versionId);

  if (error) throw new Error(`Failed to delete version: ${error.message}`);
}

export async function forkIdeaVersion(
  userId: string,
  input: ForkVersionInput
): Promise<IdeaVersion> {
  const supabase = createServerClient();

  // Get source version
  const sourceVersion = await getIdeaVersion(input.source_version_id, userId);
  if (!sourceVersion) throw new Error('Source version not found or access denied');

  // Create new version with forked data
  return createIdeaVersion(userId, {
    core_id: sourceVersion.core_id,
    version_name: input.new_version_name,
    target_program_id: input.target_program_id ?? sourceVersion.target_program_id,
    target_program_name: input.target_program_name ?? sourceVersion.target_program_name,
    validation_level: sourceVersion.validation_level,
    scorecard: sourceVersion.scorecard,
    total_score: sourceVersion.total_score,
    chat_summary: sourceVersion.chat_summary,
    key_feedback: sourceVersion.key_feedback,
    status: 'draft',
    forked_from: sourceVersion.id,
  });
}

// ============================================
// Idea Submission CRUD
// ============================================

export async function getIdeaSubmissions(
  versionId: string,
  userId: string
): Promise<IdeaSubmission[]> {
  const supabase = createServerClient();

  // Verify ownership
  const version = await getIdeaVersion(versionId, userId);
  if (!version) throw new Error('Version not found or access denied');

  const { data, error } = await supabase
    .from('idea_submissions')
    .select('*')
    .eq('version_id', versionId)
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  return data || [];
}

export async function createIdeaSubmission(
  userId: string,
  input: IdeaSubmissionCreateInput
): Promise<IdeaSubmission> {
  const supabase = createServerClient();

  // Verify ownership of version
  const version = await getIdeaVersion(input.version_id, userId);
  if (!version) throw new Error('Version not found or access denied');

  const { data, error } = await supabase
    .from('idea_submissions')
    .insert({
      version_id: input.version_id,
      program_name: input.program_name,
      submitted_at: input.submitted_at,
      deadline: input.deadline,
      result: input.result,
      result_note: input.result_note,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create submission: ${error.message}`);

  // Update version status to 'submitted'
  await supabase
    .from('idea_versions')
    .update({ status: 'submitted' })
    .eq('id', input.version_id);

  return data;
}

export async function updateIdeaSubmission(
  submissionId: string,
  userId: string,
  input: IdeaSubmissionUpdateInput
): Promise<IdeaSubmission> {
  const supabase = createServerClient();

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(submissionId)) {
    throw new Error('Invalid submission ID format');
  }

  // Get submission to verify ownership
  const { data: submission, error: fetchError } = await supabase
    .from('idea_submissions')
    .select('*, idea_versions!inner(idea_cores!inner(user_id))')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) throw new Error('Submission not found');

  // Check ownership through version -> core
  const ownerUserId = (submission as { idea_versions: { idea_cores: { user_id: string } } })
    .idea_versions.idea_cores.user_id;
  if (ownerUserId !== userId) throw new Error('Access denied');

  const { data, error } = await supabase
    .from('idea_submissions')
    .update(input)
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update submission: ${error.message}`);
  return data;
}

export async function deleteIdeaSubmission(
  submissionId: string,
  userId: string
): Promise<void> {
  const supabase = createServerClient();

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(submissionId)) {
    throw new Error('Invalid submission ID format');
  }

  // Verify ownership
  const { data: submission, error: fetchError } = await supabase
    .from('idea_submissions')
    .select('*, idea_versions!inner(idea_cores!inner(user_id))')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) throw new Error('Submission not found');

  const ownerUserId = (submission as { idea_versions: { idea_cores: { user_id: string } } })
    .idea_versions.idea_cores.user_id;
  if (ownerUserId !== userId) throw new Error('Access denied');

  const { error } = await supabase.from('idea_submissions').delete().eq('id', submissionId);

  if (error) throw new Error(`Failed to delete submission: ${error.message}`);
}

// ============================================
// Program Eligibility
// ============================================

export async function getProgramEligibilities(): Promise<ProgramEligibility[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('program_eligibility')
    .select('*')
    .order('program_name');

  if (error) throw new Error(`Failed to fetch program eligibilities: ${error.message}`);
  return data || [];
}

export async function getProgramEligibility(
  programId: string
): Promise<ProgramEligibility | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('program_eligibility')
    .select('*')
    .eq('program_id', programId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch program eligibility: ${error.message}`);
  }
  return data;
}
