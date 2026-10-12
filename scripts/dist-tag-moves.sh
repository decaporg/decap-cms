#!/usr/bin/env bash
# Moves the `beta` dist-tag to the version in the tree for every publishable
# package, so `@beta` installs and CDN URLs land on the GA release. Run it from
# a checkout of the GA version commit, after `pnpm run verify:published` passes.
# CI cannot do this (npm dist-tag add gets E401 under trusted publishing), so it
# runs from a laptop with an OTP; a new code is asked for whenever npm rejects
# the current one.
#
# Usage: scripts/dist-tag-moves.sh [--dry-run] [--tag=beta]
# Delete this script after the GA release.

set -euo pipefail

TAG=beta
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --tag=*) TAG="${arg#--tag=}" ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

SPECS=()
while IFS= read -r spec; do
  [ -n "$spec" ] && SPECS+=("$spec")
done < <(pnpm -C "$ROOT_DIR" -r ls --depth -1 --json | node -e '
  const packages = JSON.parse(require("fs").readFileSync(0, "utf8"));
  for (const { name, version, private: isPrivate } of packages) {
    if (name && !isPrivate) console.log(`${name}@${version}`);
  }
')

PRERELEASES=()
for spec in "${SPECS[@]}"; do
  case "${spec##*@}" in *-*) PRERELEASES+=("$spec") ;; esac
done
if [ "${#PRERELEASES[@]}" -gt 0 ]; then
  echo "Refusing: these tree versions are prereleases, so this is not the GA commit:" >&2
  printf '  %s\n' "${PRERELEASES[@]}" >&2
  exit 1
fi

echo "Moving '$TAG' for ${#SPECS[@]} packages"

OTP=""
ask_otp() {
  printf 'npm one-time password: ' > /dev/tty
  IFS= read -r OTP < /dev/tty
}

MOVED=0
SKIPPED=0
FAILED=()
for spec in "${SPECS[@]}"; do
  name="${spec%@*}"
  version="${spec##*@}"
  current="$(npm view "$name" "dist-tags.$TAG" 2>/dev/null || true)"
  if [ "$current" = "$version" ]; then
    echo "  $name: $TAG already $version"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  if [ "$DRY_RUN" = 1 ]; then
    echo "  would run: npm dist-tag add $spec $TAG   (now ${current:-unset})"
    continue
  fi

  for attempt in 1 2 3; do
    [ -z "$OTP" ] && ask_otp
    if output="$(npm dist-tag add "$spec" "$TAG" --otp="$OTP" 2>&1)"; then
      echo "  $name: $TAG ${current:-unset} -> $version"
      MOVED=$((MOVED + 1))
      continue 2
    fi
    if printf '%s' "$output" | grep -qiE 'EOTP|one-time pass|E401|otp'; then
      echo "  OTP rejected, enter a fresh one" > /dev/tty
      OTP=""
      continue
    fi
    echo "$output" >&2
    break
  done
  FAILED+=("$spec")
done

echo "moved: $MOVED, already there: $SKIPPED, failed: ${#FAILED[@]}"
if [ "${#FAILED[@]}" -gt 0 ]; then
  printf '  %s\n' "${FAILED[@]}" >&2
  exit 1
fi
