from github import Github


def build_pr_diff_summary(github_token: str, repo_full_name: str, pr_number: int) -> tuple[str, object]:
    gh = Github(github_token)
    repo = gh.get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)

    chunks: list[str] = []
    for file in pr.get_files():
        patch = file.patch or ""
        if len(patch) > 4000:
            patch = patch[:4000] + "\n... [truncated]"
        chunks.append(
            f"File: {file.filename}\nStatus: {file.status}\n"
            f"Additions: {file.additions}, Deletions: {file.deletions}\n"
            f"Patch:\n{patch}\n"
        )

    diff_summary = "\n\n".join(chunks)
    if len(diff_summary) > 30000:
        diff_summary = diff_summary[:30000] + "\n\n... [overall diff truncated]"

    return diff_summary, repo
