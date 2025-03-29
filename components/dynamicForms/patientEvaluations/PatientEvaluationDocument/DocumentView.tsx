// components/dynamicForms/patientEvaluations/PatientEvaluationDocument/DocumentView.tsx
import { evaluationFieldComponents, MatrixField, extractContent } from '../PatientEvaluationItems';

interface DocumentViewProps {
  items: any[];
}

const DocumentView = ({ items }: DocumentViewProps) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg space-y-2">
      {items.map((item, idx) => {
        if (item.field_type === 'matrix') {
          const previousItem = items[idx - 1];
          const prevAnswer = extractContent(previousItem)?.toLowerCase();
          const previousAnswerYes = prevAnswer === 'yes';

          return previousAnswerYes ? (
            <div key={item.id}>
              <MatrixField item={item} previousAnswerYes={previousAnswerYes} />
              {item.divider_below && <hr className="border-dashed border-gray-300 my-4" />}
            </div>
          ) : null;
        } else {
          const Component = evaluationFieldComponents[item.fieldType] || evaluationFieldComponents.default;

          return (
            <div key={item.id}>
              <Component {...item} />
              {item.divider_below && <hr className="border-dashed border-gray-300 my-4" />}
            </div>
          );
        }
      })}
    </div>
  );
}

export default DocumentView;
