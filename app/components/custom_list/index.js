// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FlatList, Platform, SectionList, Text, View} from 'react-native';

import {ListTypes} from 'app/constants';
import {makeStyleSheetFromTheme, changeOpacity} from 'app/utils/theme';

export const FLATLIST = 'flat';
export const SECTIONLIST = 'section';
const INITIAL_BATCH_TO_RENDER = 15;
const SCROLL_UP_MULTIPLIER = 6;

export default class CustomList extends PureComponent {
    static propTypes = {
        data: PropTypes.array.isRequired,
        extraData: PropTypes.any,
        listType: PropTypes.oneOf([FLATLIST, SECTIONLIST]),
        loading: PropTypes.bool,
        loadingComponent: PropTypes.element,
        noResults: PropTypes.element,
        onLoadMore: PropTypes.func,
        onRowPress: PropTypes.func,
        onRowSelect: PropTypes.func,
        renderItem: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.element,
        ]).isRequired,
        selectable: PropTypes.bool,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        listType: FLATLIST,
        showNoResults: true,
    };

    constructor(props) {
        super(props);

        this.contentOffsetY = 0;
        this.state = {};
    }

    handleLayout = (event) => {
        const {height} = event.nativeEvent.layout;
        this.setState({listHeight: height});
    };

    handleScroll = (event) => {
        const pageOffsetY = event.nativeEvent.contentOffset.y;
        if (pageOffsetY > 0) {
            const contentHeight = event.nativeEvent.contentSize.height;
            const direction = (this.contentOffsetY < pageOffsetY) ?
                ListTypes.VISIBILITY_SCROLL_UP :
                ListTypes.VISIBILITY_SCROLL_DOWN;

            this.contentOffsetY = pageOffsetY;
            if (
                direction === ListTypes.VISIBILITY_SCROLL_UP &&
                (contentHeight - pageOffsetY) < (this.state.listHeight * SCROLL_UP_MULTIPLIER)
            ) {
                this.props.onLoadMore();
            }
        }
    };

    keyExtractor = (item) => {
        return item.id || item.key || item.value || item;
    };

    renderEmptyList = () => {
        return this.props.noResults || null;
    };

    renderItem = ({item, index, section}) => {
        const {onRowPress, onRowSelect, selectable} = this.props;
        const props = {
            id: item.id,
            item,
            selected: item.selected,
            selectable,
        };

        if ('disableSelect' in item) {
            props.enabled = !item.disableSelect;
        }

        if (onRowSelect) {
            props.onPress = onRowSelect(section.title, index);
        } else {
            props.onPress = onRowPress;
        }

        // Allow passing in a component like UserListRow or ChannelListRow
        if (this.props.renderItem.prototype.isReactComponent) {
            const RowComponent = this.props.renderItem;
            return <RowComponent {...props}/>;
        }

        return this.props.renderItem(props);
    };

    renderFlatList = () => {
        const {data, extraData, theme} = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <FlatList
                contentContainerStyle={style.container}
                data={data}
                extraData={extraData}
                keyboardShouldPersistTaps='always'
                keyboardDismissMode='interactive'
                keyExtractor={this.keyExtractor}
                initialNumToRender={INITIAL_BATCH_TO_RENDER}
                ItemSeparatorComponent={this.renderSeparator}
                ListEmptyComponent={this.renderEmptyList}
                ListFooterComponent={this.renderFooter}
                maxToRenderPerBatch={INITIAL_BATCH_TO_RENDER + 1}
                onLayout={this.handleLayout}
                onScroll={this.handleScroll}
                ref={this.setListRef}
                removeClippedSubviews={true}
                renderItem={this.renderItem}
                scrollEventThrottle={60}
                style={style.list}
                stickySectionHeadersEnabled={true}
            />
        );
    };

    renderFooter = () => {
        const {loading, loadingComponent} = this.props;

        if (!loading || !loadingComponent) {
            return null;
        }

        return loadingComponent;
    };

    renderSectionHeader = ({section}) => {
        const style = getStyleFromTheme(this.props.theme);

        return (
            <View style={style.sectionWrapper}>
                <View style={style.sectionContainer}>
                    <Text style={style.sectionText}>{section.id}</Text>
                </View>
            </View>
        );
    };

    renderSectionList = () => {
        const {data, loading, theme} = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <SectionList
                contentContainerStyle={style.container}
                extraData={loading}
                keyboardShouldPersistTaps='always'
                keyboardDismissMode='interactive'
                keyExtractor={this.keyExtractor}
                initialNumToRender={INITIAL_BATCH_TO_RENDER}
                ItemSeparatorComponent={this.renderSeparator}
                ListEmptyComponent={this.renderEmptyList}
                ListFooterComponent={this.renderFooter}
                maxToRenderPerBatch={INITIAL_BATCH_TO_RENDER + 1}
                onLayout={this.handleLayout}
                onScroll={this.handleScroll}
                ref={this.setListRef}
                removeClippedSubviews={true}
                renderItem={this.renderItem}
                renderSectionHeader={this.renderSectionHeader}
                scrollEventThrottle={60}
                sections={data}
                style={style.list}
                stickySectionHeadersEnabled={false}
            />
        );
    };

    renderSeparator = () => {
        const style = getStyleFromTheme(this.props.theme);

        return (
            <View style={style.separator}/>
        );
    };

    setListRef = (ref) => {
        this.list = ref;
    };

    render() {
        const {listType} = this.props;

        if (listType === FLATLIST) {
            return this.renderFlatList();
        }

        return this.renderSectionList();
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        list: {
            backgroundColor: theme.centerChannelBg,
            flex: 1,
            ...Platform.select({
                android: {
                    marginBottom: 20,
                },
            }),
        },
        container: {
            flexGrow: 1,
        },
        separator: {
            height: 1,
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
        listView: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
            ...Platform.select({
                android: {
                    marginBottom: 20,
                },
            }),
        },
        loadingText: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
        },
        searching: {
            backgroundColor: theme.centerChannelBg,
            height: '100%',
            position: 'absolute',
            width: '100%',
        },
        sectionContainer: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.07),
            paddingLeft: 10,
            paddingVertical: 2,
        },
        sectionWrapper: {
            backgroundColor: theme.centerChannelBg,
        },
        sectionText: {
            fontWeight: '600',
            color: theme.centerChannelColor,
        },
        noResultContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        noResultText: {
            fontSize: 26,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
    };
});
