/* globals it, describe, expect, beforeEach, inject, angular */

import { DateUtil } from '../src/index'

describe('DateUtil', () => {
  describe('Period format tests', () => {
    it('should format single periods correctly', () => {
      const date = new Date(1426511608541)

      expect(DateUtil.getPeriod(date, 'month')).toEqual('2015')
      expect(DateUtil.getPeriod(date, 'day')).toEqual('201503')
      expect(DateUtil.getPeriod(date, 'hour')).toEqual('20150316')
      expect(DateUtil.getHourPeriod(date)).toEqual('2015031614')
    })

    it('should format range periods correctly', () => {
      const startDate = new Date(1423919853690)
      const endDate = new Date(1426511608541)

      expect(DateUtil.getPeriod([startDate, endDate], 'month')).toEqual('201502-201503')
      expect(DateUtil.getPeriod([startDate, endDate], 'day')).toEqual('20150214-20150316')
      expect(DateUtil.getPeriod([startDate, endDate], 'hour')).toEqual('20150214-20150316')
      expect(DateUtil.getHourPeriod([startDate, endDate])).toEqual('2015021414-2015031614')
    })
  })

  describe('Period parsing tests', () => {
    it('should parse dates correctly', () => {
      const dayString = '19830206'
      const monthString = '199502'
      const yearString = '1999'
      const hourString = '200410151020'

      expect(DateUtil.getDate(dayString).getTime()).toEqual(413334000000)
      expect(DateUtil.getDate(monthString).getTime()).toEqual(791593200000)
      expect(DateUtil.getDate(yearString).getTime()).toEqual(915145200000)
      expect(DateUtil.getDate(hourString).getTime()).toEqual(1097828400000)
    })

    it('should return null if null given as input', () => {
      expect(DateUtil.getDate(null)).toBe(null)
    })
  })

  describe('ISO parsing test', () => {
    it('should parse ISO dates correctly', () => {
      const isoDateString = '2014-08-23T22:00+0000'
      expect(DateUtil.parseISO(isoDateString).getTime()).toEqual(1408831200000)
    })
  })
})

