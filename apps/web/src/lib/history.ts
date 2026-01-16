import { getAuthUser, getSupabaseServerClient } from "./auth-server";
import { createPresignedDownloadUrl } from "./s3";

type HistoryFile = {
  id: string;
  key?: string | null;
  bucket?: string | null;
  original_name?: string | null;
  mime?: string | null;
  size_bytes?: number | null;
};

export type HistoryArtifact = {
  id: string;
  job_id: string;
  label?: string | null;
  created_at?: string | null;
  file?: HistoryFile | null;
  downloadUrl?: string | null;
};

export type HistoryJob = {
  id: string;
  converter_slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  error?: string | null;
  total_files?: number | null;
  processed_files?: number | null;
  artifacts: HistoryArtifact[];
};

export type HistoryResponse = {
  userId: string;
  jobs: HistoryJob[];
};

const normalizeArtifactFile = (
  value: HistoryFile | HistoryFile[] | null,
) => (Array.isArray(value) ? value[0] : value);

export const getHistoryData = async (): Promise<HistoryResponse | null> => {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(
      "id, converter_slug, status, created_at, updated_at, error, total_files, processed_files",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (jobsError) {
    throw new Error(jobsError.message);
  }

  const jobIds = jobs?.map((job) => job.id) ?? [];
  let artifacts: HistoryArtifact[] = [];

  if (jobIds.length > 0) {
    const { data, error: artifactsError } = await supabase
      .from("job_artifacts")
      .select(
        "id, job_id, label, created_at, file:files(id, key, bucket, original_name, mime, size_bytes)",
      )
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (artifactsError) {
      throw new Error(artifactsError.message);
    }

    const artifactsWithUrls = await Promise.all(
      (data ?? []).map(async (artifact) => {
        const file = normalizeArtifactFile(artifact.file as HistoryFile | null);
        if (!file?.key) {
          return { ...artifact, file, downloadUrl: null };
        }
        try {
          const { downloadUrl } = await createPresignedDownloadUrl({
            key: file.key,
            bucket: file.bucket ?? undefined,
          });
          return { ...artifact, file, downloadUrl };
        } catch {
          return { ...artifact, file, downloadUrl: null };
        }
      }),
    );

    artifacts = artifactsWithUrls;
  }

  const artifactsByJob = new Map<string, HistoryArtifact[]>();
  for (const artifact of artifacts) {
    const list = artifactsByJob.get(artifact.job_id) ?? [];
    list.push(artifact);
    artifactsByJob.set(artifact.job_id, list);
  }

  const jobsWithArtifacts: HistoryJob[] = (jobs ?? []).map((job) => ({
    ...job,
    artifacts: (artifactsByJob.get(job.id) ?? []).slice(0, 5),
  }));

  return {
    userId: user.id,
    jobs: jobsWithArtifacts,
  };
};
