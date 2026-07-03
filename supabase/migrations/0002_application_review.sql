-- Cache the on-demand Sonnet impact review (C2/C3 rubric + semantic JD
-- coverage) per application, mirroring how jd_extraction caches the Haiku
-- pass. Lets a page revisit re-apply the rubric without re-paying for it.
alter table applications
  add column if not exists review jsonb;  -- cached ReviewResult
