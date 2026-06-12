export default function SkillTag({ name, direction, level, onClick }) {
  const isTeach = direction === 'teach';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1 transition-all ${
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      } ${isTeach ? 'skill-tag-teach' : 'skill-tag-learn'}`}>
      <span>{isTeach ? '📤' : '📥'}</span>
      {name}
      {level && (
        <span className="opacity-60 text-xs">· {level}</span>
      )}
    </button>
  );
}
