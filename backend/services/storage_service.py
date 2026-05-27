import os
from database import get_transcripts, clear_transcript_audio, UPLOADS_DIR

class StorageService:
    @staticmethod
    def prune_uploads(max_size_mb=30, max_files=10):
        """
        Coordinates with the database to automatically delete the oldest audio files from the disk
        and clear their references in SQLite if:
          - The number of WAV files in uploads/ exceeds max_files.
          - The total size of uploads/ exceeds max_size_mb.
        This provides a zero-maintenance storage limit to prevent disk bloat.
        """
        try:
            # 1. Gather all transcripts that still have associated audio files
            records = get_transcripts()
            # Filter to those with audio files, sorted by created_at (oldest first)
            active_records = [r for r in records if r.get('audio_filename')]
            # Sort explicitly by created_at in ascending order (oldest first)
            active_records.sort(key=lambda r: r.get('created_at', ''))

            print(f"[StorageService] Active recordings with audio on disk: {len(active_records)}")

            # 2. Function to calculate current disk status
            def get_uploads_stats():
                total_size = 0
                count = 0
                for r in active_records:
                    fn = r.get('audio_filename')
                    path = os.path.join(UPLOADS_DIR, fn)
                    if os.path.exists(path):
                        total_size += os.path.getsize(path)
                        count += 1
                return total_size / (1024.0 * 1024.0), count

            size_mb, file_count = get_uploads_stats()
            print(f"[StorageService] Current storage: {size_mb:.2f} MB, {file_count} files (limits: {max_size_mb} MB, {max_files} files)")

            # 3. Prune oldest recordings systematically until both limits are met
            pruned_count = 0
            # Make a copy of the list to iterate safely since we modify active_records inside
            for record in list(active_records):
                if size_mb <= max_size_mb and file_count <= max_files:
                    break  # both constraints satisfied!

                # Prune this oldest record
                fn = record.get('audio_filename')
                path = os.path.join(UPLOADS_DIR, fn)
                
                # Delete file from disk
                if os.path.exists(path):
                    try:
                        file_size = os.path.getsize(path)
                        os.remove(path)
                        print(f"[StorageService] Pruned audio file from disk: {fn} ({file_size / 1024.0:.1f} KB)")
                    except Exception as e:
                        print(f"[StorageService] Error removing file {fn}: {e}")
                
                # Clear database reference
                clear_transcript_audio(record['id'])
                print(f"[StorageService] Cleared audio filename in database for transcript: {record['title']}")
                pruned_count += 1
                
                # Re-calculate
                # Remove from active list
                active_records.remove(record)
                size_mb, file_count = get_uploads_stats()

            if pruned_count > 0:
                print(f"[StorageService] Pruned {pruned_count} old audio files. New storage: {size_mb:.2f} MB, {file_count} files.")
            else:
                print("[StorageService] Storage remains within healthy limits. No pruning required.")

        except Exception as e:
            print(f"[StorageService] Exception during storage pruning: {e}")
