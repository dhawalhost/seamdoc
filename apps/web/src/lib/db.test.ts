import { describe, expect, it, beforeEach } from 'vitest';
import { getRevisions, saveRevision, deleteRevision, clearAllRevisions } from './db.js';

describe('Local History Database (In-Memory Fallback)', () => {
  beforeEach(async () => {
    await clearAllRevisions('default');
  });

  it('saves and retrieves revisions correctly', async () => {
    const rev1 = await saveRevision('Hello World', 'First Draft', 'default');
    expect(rev1).not.toBeNull();
    expect(rev1!.markdown).toBe('Hello World');
    expect(rev1!.title).toBe('First Draft');
    expect(rev1!.wordCount).toBe(2);

    const list = await getRevisions('default');
    expect(list).toHaveLength(1);
    expect(list[0]?.markdown).toBe('Hello World');
  });

  it('skips saving duplicate sequential edits', async () => {
    const rev1 = await saveRevision('Hello World', 'First Draft', 'default');
    expect(rev1).not.toBeNull();

    const rev2 = await saveRevision('Hello World', 'First Draft', 'default');
    expect(rev2).toBeNull();

    const list = await getRevisions('default');
    expect(list).toHaveLength(1);
  });

  it('deletes specific revisions successfully', async () => {
    const rev1 = await saveRevision('Draft 1', 'Title 1', 'default');
    const rev2 = await saveRevision('Draft 2', 'Title 2', 'default');

    expect(rev1).not.toBeNull();
    expect(rev2).not.toBeNull();

    let list = await getRevisions('default');
    expect(list).toHaveLength(2);

    await deleteRevision(rev1!.id!);

    list = await getRevisions('default');
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(rev2!.id);
  });

  it('clears all revisions for a document', async () => {
    await saveRevision('Draft 1', 'Title 1', 'default');
    await saveRevision('Draft 2', 'Title 2', 'default');

    let list = await getRevisions('default');
    expect(list).toHaveLength(2);

    await clearAllRevisions('default');

    list = await getRevisions('default');
    expect(list).toHaveLength(0);
  });
});
