publishCommit=$(git --no-pager log -1 --pretty=format:"%H" --grep="^chore(release): publish$")
ref=$(git tag -l --points-at $publishCommit)
echo "reverting publish commit $publishCommit"
echo "deleting tags $ref"
git push --delete origin $ref
echo "reverting commit $publishCommit"
git revert --no-edit $publishCommit
echo "pushing changes"
git push origin master
echo "done reverting publish"