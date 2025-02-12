/* eslint max-params: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { setAuthorDetailsId, setAuthorDetailsSort } from 'Store/Actions/authorDetailsActions';
import { setBooksTableOption, toggleBooksMonitored } from 'Store/Actions/bookActions';
import { executeCommand } from 'Store/Actions/commandActions';
import createAuthorSelector from 'Store/Selectors/createAuthorSelector';
import createClientSideCollectionSelector from 'Store/Selectors/createClientSideCollectionSelector';
import createDimensionsSelector from 'Store/Selectors/createDimensionsSelector';
import createUISettingsSelector from 'Store/Selectors/createUISettingsSelector';
import AuthorDetailsSeason from './AuthorDetailsSeason';

function createMapStateToProps() {
  return createSelector(
    createClientSideCollectionSelector('books', 'authorDetails'),
    createAuthorSelector(),
    createDimensionsSelector(),
    createUISettingsSelector(),
    (books, author, dimensions, uiSettings) => {

      const booksInGroup = books.items;

      let sortDir = 'asc';

      if (books.sortDirection === 'descending') {
        sortDir = 'desc';
      }

      const sortedBooks = _.orderBy(booksInGroup, books.sortKey, sortDir);

      return {
        items: sortedBooks,
        columns: books.columns,
        sortKey: books.sortKey,
        sortDirection: books.sortDirection,
        authorMonitored: author.monitored,
        isSmallScreen: dimensions.isSmallScreen,
        uiSettings
      };
    }
  );
}

const mapDispatchToProps = {
  setAuthorDetailsId,
  setAuthorDetailsSort,
  toggleBooksMonitored,
  setBooksTableOption,
  executeCommand
};

class AuthorDetailsSeasonConnector extends Component {

  //
  // Lifecycle

  componentDidMount() {
    this.props.setAuthorDetailsId({ authorId: this.props.authorId });
  }

  //
  // Listeners

  onTableOptionChange = (payload) => {
    this.props.setBooksTableOption(payload);
  }

  onSortPress = (sortKey) => {
    this.props.setAuthorDetailsSort({ sortKey });
  }

  onMonitorBookPress = (bookIds, monitored) => {
    this.props.toggleBooksMonitored({
      bookIds,
      monitored
    });
  }

  //
  // Render

  render() {
    return (
      <AuthorDetailsSeason
        {...this.props}
        onSortPress={this.onSortPress}
        onTableOptionChange={this.onTableOptionChange}
        onMonitorBookPress={this.onMonitorBookPress}
      />
    );
  }
}

AuthorDetailsSeasonConnector.propTypes = {
  authorId: PropTypes.number.isRequired,
  toggleBooksMonitored: PropTypes.func.isRequired,
  setBooksTableOption: PropTypes.func.isRequired,
  setAuthorDetailsId: PropTypes.func.isRequired,
  setAuthorDetailsSort: PropTypes.func.isRequired,
  executeCommand: PropTypes.func.isRequired
};

export default connect(createMapStateToProps, mapDispatchToProps)(AuthorDetailsSeasonConnector);
