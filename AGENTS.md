<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Agent rules

- Keep backend calls inside src/lib/* helpers (auth, upload, store) rather than scattering new direct backend calls in components — the owner may switch the backend to Firebase later.
- Page enter animation (.page-in) must not use transform — a transform on <main> breaks fixed-position overlays inside pages.
