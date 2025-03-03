import { useEffect } from 'react';

import { useColumnDefinitionsFromFieldMetadata } from '@/object-metadata/hooks/useColumnDefinitionsFromFieldMetadata';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useHandleToggleColumnFilter } from '@/object-record/record-index/hooks/useHandleToggleColumnFilter';
import { useHandleToggleColumnSort } from '@/object-record/record-index/hooks/useHandleToggleColumnSort';
import { useSetRecordIndexEntityCount } from '@/object-record/record-index/hooks/useSetRecordIndexEntityCount';
import { useRecordTable } from '@/object-record/record-table/hooks/useRecordTable';
import { viewFieldAggregateOperationState } from '@/object-record/record-table/record-table-footer/states/viewFieldAggregateOperationState';
import { convertAggregateOperationToExtendedAggregateOperation } from '@/object-record/utils/convertAggregateOperationToExtendedAggregateOperation';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { ViewField } from '@/views/types/ViewField';
import { useRecoilCallback } from 'recoil';
import { isDefined } from 'twenty-shared';

export const RecordIndexTableContainerEffect = () => {
  const { recordIndexId, objectNameSingular } = useRecordIndexContextOrThrow();

  const viewBarId = recordIndexId;

  const {
    setAvailableTableColumns,
    setOnEntityCountChange,
    setOnToggleColumnFilter,
    setOnToggleColumnSort,
  } = useRecordTable({
    recordTableId: recordIndexId,
  });

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const { columnDefinitions } =
    useColumnDefinitionsFromFieldMetadata(objectMetadataItem);

  const { setRecordIndexEntityCount } = useSetRecordIndexEntityCount(viewBarId);

  useEffect(() => {
    setAvailableTableColumns(columnDefinitions);
  }, [columnDefinitions, setAvailableTableColumns]);

  const handleToggleColumnFilter = useHandleToggleColumnFilter({
    objectNameSingular,
    viewBarId,
  });

  const handleToggleColumnSort = useHandleToggleColumnSort({
    objectNameSingular,
  });

  const { currentView } = useGetCurrentViewOnly();

  useEffect(() => {
    setOnToggleColumnFilter(
      () => (fieldMetadataId: string) =>
        handleToggleColumnFilter(fieldMetadataId),
    );
  }, [setOnToggleColumnFilter, handleToggleColumnFilter]);

  useEffect(() => {
    setOnToggleColumnSort(
      () => (fieldMetadataId: string) =>
        handleToggleColumnSort(fieldMetadataId),
    );
  }, [setOnToggleColumnSort, handleToggleColumnSort]);

  useEffect(() => {
    setOnEntityCountChange(
      () => (entityCount: number, currentRecordGroupId?: string) =>
        setRecordIndexEntityCount(entityCount, currentRecordGroupId),
    );
  }, [setRecordIndexEntityCount, setOnEntityCountChange]);

  const setViewFieldAggregateOperation = useRecoilCallback(
    ({ set, snapshot }) =>
      (viewField: ViewField) => {
        const aggregateOperationForViewField = snapshot
          .getLoadable(
            viewFieldAggregateOperationState({
              viewFieldId: viewField.id,
            }),
          )
          .getValue();

        const viewFieldMetadataType = columnDefinitions.find(
          (columnDefinition) =>
            columnDefinition.fieldMetadataId === viewField.fieldMetadataId,
        )?.type;

        const convertedViewFieldAggregateOperation = isDefined(
          viewField.aggregateOperation,
        )
          ? convertAggregateOperationToExtendedAggregateOperation(
              viewField.aggregateOperation,
              viewFieldMetadataType,
            )
          : viewField.aggregateOperation;

        if (
          aggregateOperationForViewField !==
          convertedViewFieldAggregateOperation
        ) {
          set(
            viewFieldAggregateOperationState({
              viewFieldId: viewField.id,
            }),
            convertedViewFieldAggregateOperation,
          );
        }
      },
    [columnDefinitions],
  );

  useEffect(() => {
    currentView?.viewFields.forEach((viewField) => {
      setViewFieldAggregateOperation(viewField);
    });
  }, [currentView, setViewFieldAggregateOperation]);

  return <></>;
};
