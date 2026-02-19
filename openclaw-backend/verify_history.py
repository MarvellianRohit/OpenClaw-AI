"""
verify_history.py - Direct verification of Phase BV Git-Awareness (Shadow History)
Bypasses HTTP layer and directly tests find_deleted_code logic.
"""
import sys
import os
import time

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from version_history import save_snapshot, find_deleted_code, list_snapshots, get_snapshot_content

TEST_FILE = os.path.abspath("test_history.txt")

def test_shadow_history():
    print(f"🧪 Testing Shadow History on {TEST_FILE}...")

    # Clean up old test snapshots so we get fresh results
    from version_history import SNAPSHOT_DIR
    safe_name = TEST_FILE.replace("/", "_").replace(".", "_").replace(" ", "_")
    snap_dir = os.path.join(SNAPSHOT_DIR, safe_name)
    if os.path.exists(snap_dir):
        import shutil
        shutil.rmtree(snap_dir)
        print(f"🧹 Cleared old snapshots in {snap_dir}")

    # 1. Create Initial File (Snapshot 1)
    content_v1 = "Function A\nFunction B\nFunction C\n"
    print("📝 Saving Version 1 (with Function B)...")
    save_snapshot(TEST_FILE, content_v1)
    time.sleep(1)  # Ensure timestamp diff

    # 2. Modify File (Delete Function B) (Snapshot 2)
    content_v2 = "Function A\nFunction C\n"
    print("📝 Saving Version 2 (deleted Function B)...")
    save_snapshot(TEST_FILE, content_v2)
    time.sleep(0.5)

    # Verify snapshot count
    snaps = list_snapshots(TEST_FILE)
    print(f"📦 Total snapshots found: {len(snaps)}")
    for s in snaps:
        content = get_snapshot_content(TEST_FILE, s['timestamp'])
        print(f"   → [{s['timestamp']}] {repr(content.strip())}")

    if len(snaps) < 2:
        print("❌ FAIL: Not enough snapshots created")
        return

    # 3. Retrieve Deleted Code
    print("\n🔍 Searching for deleted 'Function B'...")
    results = find_deleted_code(TEST_FILE, "Function B")

    if results:
        print(f"✅ SUCCESS: Found {len(results)} deleted block(s):")
        for res in results:
            print(f"   - Time: {res['timestamp']}")
            print(f"   - Content: {repr(res['content'])}")
            print(f"   - Lines: {res['lines']}")
        if any("Function B" in r['content'] for r in results):
            print("\n🎉 Phase BV VERIFIED: find_deleted_code correctly retrieved deleted code!")
    else:
        print("❌ FAIL: No deleted blocks found")

    # Cleanup test file
    if os.path.exists(TEST_FILE):
        os.remove(TEST_FILE)

if __name__ == "__main__":
    test_shadow_history()
