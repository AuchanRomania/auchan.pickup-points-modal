import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { injectIntl, intlShape } from 'react-intl'

import { translate } from '../utils/i18nUtils'
import {
  getUnavailableItemsByPickup,
  getItemsWithPickupPoint,
} from '../utils/pickupUtils'
import PickupPointInfo from './PickupPointInfo'
import ProductItems from './ProductItems'
import Button from './Button'
import ArrowPrevious from '../assets/components/ArrowPrevious'
import ArrowNext from '../assets/components/ArrowNext'
import BackChevron from '../assets/components/BackChevron'
import styles from './PickupPointDetails.css'
import { LIST, ARROW_LEFT, ARROW_RIGHT } from '../constants'
import { injectState } from '../modalStateContext'
import { updateShippingData } from '../fetchers'
import { getCleanId } from '../utils/StateUtils'
import PickupBusinessHours from './PickupBusinessHours'
import { pickupPointConfirmationEvent } from '../utils/metrics'

class PickupPointDetails extends Component {
  constructor(props) {
    super(props)

    this.state = {
      unavailableItems: getUnavailableItemsByPickup(
          props.items,
          props.logisticsInfo,
          props.selectedPickupPoint,
          props.sellerId
      ),
      items: getItemsWithPickupPoint(
          props.items,
          props.logisticsInfo,
          props.selectedPickupPoint,
          props.sellerId
      ),
      pickupPointInfo: this.getPickupInfo(props),
    }
  }

  componentDidMount() {
    if (!this.props.selectedPickupPoint) {
      this.props.setActiveSidebarState(LIST)
    }

    this.keyListener = document.addEventListener('keydown', (event) => {
      if (event.code === ARROW_LEFT) {
        this.props.selectPreviousPickupPoint()
      } else if (event.code === ARROW_RIGHT) {
        this.props.selectNextPickupPoint()
      }
    })
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keyListener)
  }

  componentDidUpdate(prevProps) {
    const { props } = this

    if (prevProps.selectedPickupPoint.id !== props.selectedPickupPoint.id) {
      this.setState({
        unavailableItems: getUnavailableItemsByPickup(
            props.items,
            props.logisticsInfo,
            props.selectedPickupPoint,
            props.sellerId
        ),
        items: getItemsWithPickupPoint(
            props.items,
            props.logisticsInfo,
            props.selectedPickupPoint,
            props.sellerId
        ),
        pickupPointInfo: this.getPickupInfo(props),
      })
    }
  }

  getPickupInfo = (props) => {
    return props.pickupPoints.find(
        (pickupPoint) =>
            pickupPoint.id === props.selectedPickupPoint.pickupPointId
    )
  }

  handleBackButtonClick = () => {
    this.props.setActiveSidebarState(LIST)

    setTimeout(() => {
      const id = getCleanId(this.props.selectedPickupPoint.id)
      const selectedPickupPointElement = document.querySelector(`#${id}`)

      if (selectedPickupPointElement) {
        selectedPickupPointElement.scrollIntoView()
      }
    }, 100)

    this.props.setSelectedPickupPoint({ pickupPoint: null })
  }

  handleConfirmButtonClick = () => {
    updateShippingData(
        this.props.residentialAddress,
        this.props.logisticsInfo,
        this.props.selectedPickupPoint
    )

    pickupPointConfirmationEvent()
    this.props.handleClosePickupPointsModal()
  }

  render() {
    const {
      bestPickupOptions,
      isSelectedSla,
      logisticsInfo,
      intl,
      selectedPickupPoint,
      selectedRules,
      sellerId,
      shouldUseMaps,
      storePreferencesData,
    } = this.props

    const { unavailableItems, items, pickupPointInfo } = this.state

    const businessHours =
        !pickupPointInfo ||
        !pickupPointInfo.businessHours ||
        pickupPointInfo.businessHours.length === 0
            ? null
            : pickupPointInfo.businessHours

    const hasAditionalInfo =
        selectedPickupPoint.pickupStoreInfo &&
        selectedPickupPoint.pickupStoreInfo.additionalInfo

    const shouldShowSelectPickupButton =
        selectedPickupPoint && selectedPickupPoint.pickupStoreInfo

    const confirmButtonId =
        selectedPickupPoint &&
        `confirm-pickup-${selectedPickupPoint.id
            .replace(/[^\w\s]/gi, '')
            .split(' ')
            .join('-')}`

    const pickupIndex =
        bestPickupOptions &&
        bestPickupOptions
            .map((pickupPoint) => pickupPoint.id || pickupPoint.pickupPointId)
            .indexOf(selectedPickupPoint.id || selectedPickupPoint.pickupPointId)

    const isFirst = pickupIndex === 0
    const isLast =
        bestPickupOptions && pickupIndex === bestPickupOptions.length - 1

    return (
        <div className={`${styles.modalDetails} pkpmodal-details`}>
          <div className={`${styles.modalDetailsTop} pkpmodal-details-top`}>
            <div className={`${styles.modalDetailsTopTitle} pkpmodal-details-top-title`}>
              <h2>{intl.formatMessage({id: 'pickupPointsModal.pickPickupPoint'})}</h2>
              <button
                  className={`${styles.modalDetailsBackLnk} pkpmodal-details-back-lnk btn btn-link`}
                  onClick={this.handleBackButtonClick}
                  type="button"
              >
                {translate(intl, 'cancelBackList')}
                <BackChevron/>
              </button>
            </div>
          </div>

          <div className={`${styles.modalDetailsMiddle} pkpmodal-details-middle`}>
            <div className={`${styles.modalDetailsStore} pkpmodal-details-store`}>
              <PickupPointInfo
                  shouldUseMaps={shouldUseMaps}
                  isSelected={isSelectedSla}
                  items={this.props.items}
                  logisticsInfo={logisticsInfo}
                  pickupPoint={selectedPickupPoint}
                  selectedRules={selectedRules}
                  sellerId={sellerId}
                  storePreferencesData={storePreferencesData}
              />
              <div className={`${styles.modalDetailsInfo} pkpmodal-details-info`}>
                <div
                    className={`${styles.modalDetailsGroup} pkpmodal-details-group`}
                >
                  <h3
                      className={`${styles.modalDetailsInfoTitle} title pkpmodal-details-info-title`}
                  >
                    {translate(intl, 'productsInPoint')}
                  </h3>
                  {items && <ProductItems items={items}/>}
                  {unavailableItems && (
                      <ProductItems isAvailable={false} items={unavailableItems}/>
                  )}
                </div>
                {hasAditionalInfo && (
                    <div
                        className={`${styles.modalDetailsGroup} pkpmodal-details-group`}
                    >
                      <h3
                          className={`${styles.modalDetailsInfoTitle} pkpmodal-details-info-title`}
                      >
                        {translate(intl, 'aditionalInfo')}
                      </h3>
                      {selectedPickupPoint.pickupStoreInfo.additionalInfo}
                    </div>
                )}

                {businessHours && (
                    <PickupBusinessHours businessHours={businessHours}/>
                )}
              </div>
            </div>
          </div>

          {shouldShowSelectPickupButton && (
              <div
                  className={`${styles.modalDetailsBottom} pkpmodal-details-bottom`}
              >
                <Button
                    id={confirmButtonId}
                    kind="primary"
                    large
                    moreClassName={`${styles.modalDetailConfirmBtn} pkpmodal-details-confirm-btn`}
                    onClick={this.handleConfirmButtonClick}
                    title={translate(intl, 'confirmPoint')}
                />
              </div>
          )}
        </div>
    )
  }
}

PickupPointDetails.propTypes = {
  bestPickupOptions: PropTypes.array.isRequired,
  handleClosePickupPointsModal: PropTypes.func.isRequired,
  intl: intlShape.isRequired,
  isSelectedSla: PropTypes.bool,
  items: PropTypes.array.isRequired,
  logisticsInfo: PropTypes.array.isRequired,
  onClickPickupModal: PropTypes.func,
  residentialAddress: PropTypes.object,
  selectedRules: PropTypes.object.isRequired,
  selectedPickupPoint: PropTypes.object.isRequired,
  sellerId: PropTypes.string,
  storePreferencesData: PropTypes.object.isRequired,
  selectNextPickupPoint: PropTypes.func,
  selectPreviousPickupPoint: PropTypes.func,
  setActiveSidebarState: PropTypes.func.isRequired,
  setSelectedPickupPoint: PropTypes.func.isRequired,
  shouldUseMaps: PropTypes.bool.isRequired,
}

export default injectState(injectIntl(PickupPointDetails))
