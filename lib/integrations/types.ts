export type ExternalCandidate = {
  externalId: string;
  fullName: string;
  title?: string;
  location?: string;
  skills?: string[];
  resumeUrl?: string;
  raw: unknown;
};

export type PostResult = {
  externalPostingId: string;
  postingUrl?: string;
  raw: unknown;
};

export interface JobBoardAdapter {
  readonly provider: string;
  /** True once real credentials are stored & enabled for this provider. */
  isConfigured(): Promise<boolean>;
  /** Push a requirement out as a job posting on the board. */
  postRequirement(requirement: { title: string; description: string; location: string; skills: string }): Promise<PostResult>;
  /** Search the board's candidate/resume database. */
  searchCandidates(query: { keywords: string; location?: string }): Promise<ExternalCandidate[]>;
  /** Pull one candidate's full profile/resume for import. */
  importCandidate(externalId: string): Promise<ExternalCandidate>;
}
