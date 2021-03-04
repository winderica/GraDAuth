import {
    AddBox,
    ArrowDownward,
    Check,
    ChevronLeft,
    ChevronRight,
    Clear,
    DeleteOutline,
    Edit,
    FilterList,
    FirstPage,
    LastPage,
    Remove,
    SaveAlt,
    Search,
    SvgIconComponent,
    ViewColumn,
} from '@material-ui/icons';
import MaterialTable from 'material-table';
import { observer } from 'mobx-react-lite';
import React, { FC, forwardRef, ForwardRefRenderFunction } from 'react';

import { UserDataStore } from '../stores';

interface Props {
    title: string;
    dataStore: UserDataStore;
}

const forwardSVGRef = (Icon: SvgIconComponent) => {
    const render: ForwardRefRenderFunction<SVGSVGElement> = (props, ref) => <Icon {...props} ref={ref} />;
    return forwardRef(render);
};

export const Table: FC<Props> = observer(({ title, dataStore }) => {
    return (
        <MaterialTable
            title={title}
            data={dataStore.dataArray}
            columns={[
                { title: '键', field: 'key', grouping: false },
                { title: '值', field: 'value', grouping: false },
                { title: '标签', field: 'tag' },
            ]}
            icons={{
                Add: forwardSVGRef(AddBox),
                Check: forwardSVGRef(Check),
                Clear: forwardSVGRef(Clear),
                Delete: forwardSVGRef(DeleteOutline),
                DetailPanel: forwardSVGRef(ChevronRight),
                Edit: forwardSVGRef(Edit),
                Export: forwardSVGRef(SaveAlt),
                Filter: forwardSVGRef(FilterList),
                FirstPage: forwardSVGRef(FirstPage),
                LastPage: forwardSVGRef(LastPage),
                NextPage: forwardSVGRef(ChevronRight),
                PreviousPage: forwardSVGRef(ChevronLeft),
                ResetSearch: forwardSVGRef(Clear),
                Search: forwardSVGRef(Search),
                SortArrow: forwardSVGRef(ArrowDownward),
                ThirdStateCheck: forwardSVGRef(Remove),
                ViewColumn: forwardSVGRef(ViewColumn),
            }}
            editable={{
                /* eslint-disable @typescript-eslint/require-await */
                onRowDelete: async ({ key }) => dataStore.del(key),
                onRowAdd: async ({ key, value, tag }) => dataStore.set(key, value, tag),
                onRowUpdate: async ({ key, value, tag }, oldData) => {
                    oldData && oldData.key !== key && dataStore.del(oldData.key);
                    dataStore.set(key, value, tag);
                },
                /* eslint-enable @typescript-eslint/require-await */
            }}
            options={{
                search: false,
                headerStyle: {
                    padding: 16,
                    whiteSpace: 'nowrap',
                },
                grouping: true,
            }}
            localization={{
                header: {
                    actions: '修改/删除',
                },
                grouping: {
                    placeholder: '将标签列标题拖拽至此以进行分组',
                    groupedBy: '分组：',
                },
                body: {
                    emptyDataSourceMessage: '暂无数据',
                    editRow: {
                        saveTooltip: '保存',
                        cancelTooltip: '取消',
                        deleteText: '确定删除？',
                    },
                    addTooltip: '添加',
                    deleteTooltip: '删除',
                    editTooltip: '编辑',
                },
                pagination: {
                    firstTooltip: '第一页',
                    previousTooltip: '前一页',
                    nextTooltip: '下一页',
                    labelDisplayedRows: '{from}到{to}行 共{count}行',
                    lastTooltip: '最后一页',
                    labelRowsSelect: '行每页',
                },
            }}
        />
    );
});
